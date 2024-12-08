from contextlib import asynccontextmanager
import sqlite3
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import base64
import json
from pathlib import Path
import psutil
import zmq.asyncio
import asyncio
from typing import AsyncGenerator, Dict, List, Optional, TypedDict
from pydantic import BaseModel
from datetime import datetime, timedelta, time
from typing import Literal

class Vertex(BaseModel):
    id: int
    x: float
    y: float

class VertexGroup(BaseModel):
    vertices: List[Vertex]
    label: str

class FrameConsumer:
    def __init__(self, port: int = 5555):
        self.port = port
        self.context = zmq.asyncio.Context()
        self.socket = self.context.socket(zmq.SUB)
        self.socket.setsockopt(zmq.RCVHWM, 2)
        self.socket.setsockopt(zmq.LINGER, 0)  # Add LINGER option
        self.socket.connect(f"tcp://localhost:{port}")
        self.socket.subscribe(b"")
        
    async def receive_frame(self) -> bytes | None:
        try:
            return await self.socket.recv()
        except Exception as e:
            print(f"Error receiving frame: {e}")
            return None
    
    async def close(self):
        try:
            if hasattr(self, 'socket') and self.socket:
                self.socket.close(linger=0)
                self.socket = None
            if hasattr(self, 'context') and self.context:
                await self.context.term()
                self.context = None
        except Exception as e:
            print(f"Error during FrameConsumer cleanup: {e}")

    def __del__(self):
        """Ensure cleanup even if close() wasn't called"""
        if hasattr(self, 'socket') and self.socket:
            self.socket.close(linger=0)
        if hasattr(self, 'context') and self.context:
            self.context.term()


frame_consumer: FrameConsumer | None = None

def init_db():
    conn = sqlite3.connect('traffic.db')
    cursor = conn.cursor()
    
    # Create table for vehicle tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vehicle_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        vehicle_count INTEGER,
        is_red_light_runner BOOLEAN
    )
    ''')
    
    conn.commit()
    conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global frame_consumer
    try:
        frame_consumer = FrameConsumer()
        init_db()
        yield
    finally:
        if frame_consumer:
            await frame_consumer.close()
            frame_consumer = None
        # Clean up any lingering ZMQ contexts
        try:
            for ctx in zmq.Context.instance().contexts:
                ctx.term()
        except Exception as e:
            print(f"Error during ZMQ context cleanup: {e}")


app = FastAPI(lifespan=lifespan)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    if not frame_consumer:
        await websocket.close(code=1011)
        return
        
    await websocket.accept()
    
    # Create ZMQ context and socket
    context = zmq.asyncio.Context()  # Use asyncio context instead
    socket = context.socket(zmq.SUB)
    socket.setsockopt(zmq.RCVHWM, 2)  # Set high water mark
    socket.connect("tcp://localhost:5555")
    socket.setsockopt_string(zmq.SUBSCRIBE, "")
    
    try:
        while True:
            try:
                # Use asyncio-native receive
                message = await socket.recv()
                
                # Split the message using the delimiter
                delimiter = b':::'
                parts = message.split(delimiter)
                
                if len(parts) == 2:
                    # Parse metadata
                    metadata_json = parts[0].decode('utf-8')
                    metadata = json.loads(metadata_json)
                    
                    # Get frame data
                    frame_data = parts[1]
                    
                    # Encode frame as base64
                    frame_base64 = base64.b64encode(frame_data).decode('utf-8')
                    
                    # Combine into a single JSON message
                    response = {
                        "metadata": metadata,
                        "frame": frame_base64
                    }
                    
                    # Send to frontend
                    await websocket.send_json(response)
                    
                await asyncio.sleep(0.016)  # Keep the frame rate limit
                
            except zmq.error.ZMQError as e:
                print(f"ZMQ Error: {e}")
                break
                
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error in websocket: {e}")
    finally:
        # Proper cleanup sequence
        try:
            socket.setsockopt(zmq.LINGER, 0)  # Don't wait for unsent messages
            socket.close()
            await context.term()  # Use async termination
        except Exception as e:
            print(f"Error during cleanup: {e}")

@app.get("/stats")
async def get_vehicle_stats(
   start_date: str | None = None,
   end_date: str | None = None,
):
   conn = sqlite3.connect('traffic.db')
   cursor = conn.cursor()
   
   query = '''
       SELECT 
           strftime('%Y-%m-%d %H:00', timestamp, 'localtime') as full_timestamp,
           COUNT(*) as total_vehicles,
           SUM(CASE WHEN is_red_light_runner = 1 THEN 1 ELSE 0 END) as red_light_runners
       FROM vehicle_tracking
       WHERE datetime(timestamp, "localtime") BETWEEN datetime(?, "00:00:00") AND datetime(?, "23:59:59")
   '''
   
   params = [start_date, end_date]
   
   query += '''
       GROUP BY strftime('%Y-%m-%d %H', timestamp, 'localtime')
       ORDER BY timestamp ASC
   '''
   
   cursor.execute(query, params)
   results = cursor.fetchall()
   
   stats = [
       {
           "hour": datetime.strptime(row[0], '%Y-%m-%d %H:00').strftime('%m-%d %I%p').replace(' 0', ' '),
           "total_vehicles": row[1],
           "red_light_runners": row[2]
       }
       for row in results
   ]
   
   return {
       "hourly_stats": stats,
       "summary": {
           "total_vehicles": sum(s["total_vehicles"] for s in stats),
           "total_red_light_runners": sum(s["red_light_runners"] for s in stats)
       }
   }

@app.get("/images")
async def get_images():
    """Endpoint to retrieve the last 15 base64-encoded images from the red_light_runners directory."""
    directory = Path("./red_light_runners")
    
    if not directory.exists():
        raise HTTPException(status_code=404, detail="Directory not found")
        
    image_data = []
    image_extensions = ('.jpg', '.jpeg', '.png')
    
    # Get all files with specified image extensions, sorted by timestamp in the filename
    image_files = sorted(
        [f for f in directory.iterdir() if f.suffix.lower() in image_extensions],
        key=lambda x: x.name.split("_")[0],  # Extract the timestamp from the filename
        reverse=True
    )[:15]  # Get the last 15 offenders
    
    for image_path in image_files:
        try:
            # Read the image file as binary
            with open(image_path, "rb") as img_file:
                # Convert to base64
                base64_image = base64.b64encode(img_file.read()).decode()
                
                image_data.append({
                    "filename": image_path.name,
                    "data": f"data:image/{image_path.suffix[1:].lower()};base64,{base64_image}"
                })
                
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
            continue
    
    return JSONResponse(content={"images": image_data})

def write_zone_to_file(filename: str, vertices: List[List[float]]):
    with open(filename, 'w') as json_file:
        json.dump(vertices, json_file)


def serialize_and_write_to_file(obj: VertexGroup):
    new_vertices = [[vertex.x, vertex.y] for vertex in obj.vertices]

    if obj.label == 'red_zone':
        write_zone_to_file('red_zone.json', new_vertices)
    elif obj.label == 'green_zone':
        write_zone_to_file('green_zone.json', new_vertices)
    elif obj.label == 'green_zone_2':
        write_zone_to_file('green_zone_2.json', new_vertices)
    else:
        write_zone_to_file('traffic_zone.json', new_vertices)


def validate_vertices(vertices: List[Vertex]) -> str:
    if len(vertices) != 4:  # Replace with 4 if needed
        return "Vertices must have exactly 4 items."
    for vertex in vertices:
        if not (0 <= vertex.x <= 640):
            return f"Vertex x coordinate {vertex.x} is out of range (0-640)."
        if not (0 <= vertex.y <= 640):
            return f"Vertex y coordinate {vertex.y} is out of range (0-640)."
    return ""


@app.post("/update")
async def create_item(item: VertexGroup):

    
    # Validate vertices
    validation_error = validate_vertices(item.vertices)
    if validation_error:
        return {
            "message": f"Item received unsuccessfully: {validation_error}",
            "item_data": item.model_dump()
        }
    
    # Serialize and write to file
    serialize_and_write_to_file(item)
    
    return {
        "message": "Item received successfully",
        "item_data": item.model_dump()
    }


if __name__ == "__main__":
    
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="/etc/ssl/traffic/origin.key",
        ssl_certfile="/etc/ssl/traffic/origin.pem"
    )


