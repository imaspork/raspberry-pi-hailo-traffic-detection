# frame_publisher.py
import json
import cv2
import zmq

class FramePublisher:
    def __init__(self, port=5555):
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.PUB)
        self.socket.setsockopt(zmq.SNDHWM, 2)
        self.socket.bind(f"tcp://*:{port}")
    
    def publish_frame_with_metadata(self, frame_rgb, metadata):
        """Publish frame along with metadata."""
        if frame_rgb is not None and metadata is not None:
            # Serialize metadata to JSON
            metadata_json = json.dumps(metadata)
            
            # Optimize JPEG encoding for speed
            encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 85]
            _, buffer = cv2.imencode('.jpg', frame_rgb, encode_params)
            
            # Convert metadata and frame buffer to bytes
            metadata_bytes = metadata_json.encode('utf-8')
            delimiter = b':::'  # Define a delimiter to separate metadata from frame
            
            # Send metadata and frame as a single message
            self.socket.send(metadata_bytes + delimiter + buffer.tobytes())
    
    def close(self):
        """Clean up ZMQ resources."""
        self.socket.close()
        self.context.term()