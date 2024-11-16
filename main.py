# from fastapi import FastAPI, HTTPException
# from fastapi.responses import JSONResponse
# import base64
# from pathlib import Path

# app = FastAPI()

# @app.get("/images")
# async def get_images():
#     # Path to the red_light_runners directory
#     directory = Path("./red_light_runners")
    
#     if not directory.exists():
#         raise HTTPException(status_code=404, detail="Directory not found")
        
#     image_data = []
    
#     # Get all files with common image extensions
#     image_files = list(directory.glob("*.jpg")) + list(directory.glob("*.jpeg")) + list(directory.glob("*.png"))
    
#     for image_path in image_files:
#         try:
#             # Read the image file as binary
#             with open(image_path, "rb") as img_file:
#                 # Convert to base64
#                 base64_image = base64.b64encode(img_file.read()).decode()
                
#                 image_data.append({
#                     "filename": image_path.name,
#                     "data": f"data:image/{image_path.suffix[1:].lower()};base64,{base64_image}"
#                 })
                
#         except Exception as e:
#             print(f"Error processing {image_path}: {str(e)}")
#             continue
    
#     return JSONResponse(content={"images": image_data})

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import base64
import json
from pathlib import Path
import zmq.asyncio
import asyncio
from typing import AsyncGenerator

class FrameConsumer:
    def __init__(self, port: int = 5555):
        self.context = zmq.asyncio.Context()
        self.socket = self.context.socket(zmq.SUB)
        self.socket.setsockopt(zmq.RCVHWM, 2)
        self.socket.connect(f"tcp://localhost:{port}")
        self.socket.subscribe(b"")
        
    async def receive_frame(self) -> bytes | None:
        try:
            return await self.socket.recv()
        except Exception as e:
            print(f"Error receiving frame: {e}")
            return None
    
    async def close(self):
        self.socket.close()
        self.context.term()

        # look into claude and validate cloud flare tunnel config

frame_consumer: FrameConsumer | None = None

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    global frame_consumer
    try:
        frame_consumer = FrameConsumer()
        yield
    finally:
        if frame_consumer:
            await frame_consumer.close()

app = FastAPI(lifespan=lifespan)

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     if not frame_consumer:
#         await websocket.close(code=1011)
#         return
        
#     await websocket.accept()
    
#     try:
#         while True:
#             frame_data = await frame_consumer.receive_frame()
#             if frame_data:
#                 await websocket.send_bytes(frame_data)
#             await asyncio.sleep(0.016)  # ~60 FPS
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#     finally:
#         await websocket.close()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    if not frame_consumer:  # Keep your original check
        await websocket.close(code=1011)
        return
        
    await websocket.accept()
    
    # Create ZMQ subscriber
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect("tcp://localhost:5555")
    socket.setsockopt_string(zmq.SUBSCRIBE, "")
    
    try:
        while True:
            try:
                # Receive message from ZMQ
                message = await asyncio.get_event_loop().run_in_executor(
                    None, socket.recv
                )
                
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
        socket.close()
        context.term()
        await websocket.close()

@app.get("/images")
async def get_images():
    """Endpoint to retrieve base64-encoded images from the red_light_runners directory."""
    directory = Path("./red_light_runners")
    
    if not directory.exists():
        raise HTTPException(status_code=404, detail="Directory not found")
        
    image_data = []
    image_extensions = ('.jpg', '.jpeg', '.png')
    
    # Get all files with specified image extensions
    image_files = [f for f in directory.iterdir() if f.suffix.lower() in image_extensions]
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="/etc/ssl/traffic/origin.key",
        ssl_certfile="/etc/ssl/traffic/origin.pem"
    )


