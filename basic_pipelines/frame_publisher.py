import json
import socket
import time
import cv2
import psutil
import zmq

def is_port_free(port):
    """Check if port is available"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def cleanup_existing_process(port=5555):
    """Clean up any process using the specified port"""
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            connections = proc.connections()
            for conn in connections:
                if hasattr(conn, 'laddr') and conn.laddr.port == port:
                    print(f"Found process {proc.pid} using port {port}")
                    proc.kill()
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.Error):
            continue
    return False

class FramePublisher:
    def __init__(self, port=5555):
        # Clean up existing process and wait for port to be free
        if cleanup_existing_process(port):
            print("Waiting for port to be freed...")
            time.sleep(2)  # Wait for OS to clean up the port
            
        # Verify port is free
        if not is_port_free(port):
            raise Exception(f"Port {port} is still in use after cleanup attempt")
            
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.PUB)
        self.socket.setsockopt(zmq.SNDHWM, 2)
        self.socket.setsockopt(zmq.LINGER, 0)  # Don't wait when closing
        self.socket.bind(f"tcp://*:{port}")
        print(f"Successfully bound to port {port}")
    
    def publish_frame_with_metadata(self, frame_rgb, metadata):
        """Publish frame along with metadata."""
        try:
            
            if frame_rgb is not None and metadata is not None:
                metadata_json = json.dumps(metadata)
                encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 85]
                _, buffer = cv2.imencode('.jpg', frame_rgb, encode_params)
                metadata_bytes = metadata_json.encode('utf-8')
                delimiter = b':::'
                self.socket.send(metadata_bytes + delimiter + buffer.tobytes(), zmq.NOBLOCK)
        except zmq.error.ZMQError as e:
            print(f"ZMQ error during publish: {e}")
        except Exception as e:
            print(f"Error during publish: {e}")
    
    def close(self):
        """Clean up ZMQ resources."""
        if hasattr(self, 'socket'):
            self.socket.close()
        if hasattr(self, 'context'):
            self.context.term()

    def __del__(self):
        """Ensure cleanup on object destruction"""
        self.close()