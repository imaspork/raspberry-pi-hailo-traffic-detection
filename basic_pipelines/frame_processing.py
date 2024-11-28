import cv2
import numpy as np
from typing import Tuple, List, Dict, Optional
import hailo
from hailo_rpi_common import (
    get_numpy_from_buffer,
)

class FrameProcessor:
    """Handles frame processing, detection and visualization."""
    
    def __init__(self):
        self.colors = {
            'text': (55, 255, 255),
            'vehicle_box': (50, 180, 0),
            'detection_count': (0, 255, 0)
        }
        
    def setup_frame(self, buffer, format, width, height) -> Optional[np.ndarray]:
        """Extract and prepare frame from buffer if available."""
        if buffer is None:
            return None
            
        frame = get_numpy_from_buffer(buffer, format, width, height)
        return frame
    
    def process_detections(self, buffer, width: int, height: int, zone_manager) -> Tuple[List, int]:
        """Process detections from buffer and filter relevant vehicles."""
        roi = hailo.get_roi_from_buffer(buffer)
        detections = roi.get_objects_typed(hailo.HAILO_DETECTION)
        detection_count = 0
        relevant_detections = []
        
        for detection in detections:
            if detection.get_label() == "car":
                bbox = detection.get_bbox()
                x1, y1 = int(bbox.xmin() * width), int(bbox.ymin() * height)
                x2, y2 = int(bbox.xmax() * width), int(bbox.ymax() * height)
                car_center = (x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2)
                
                if (zone_manager.is_in_zone(zone_manager.get_zone('green_zone'), car_center) or 
                    zone_manager.is_in_zone(zone_manager.get_zone('red_zone'), car_center)):
                    relevant_detections.append(detection)
                    detection_count += 1
        
        return relevant_detections, detection_count
    
    def draw_vehicle_info(self, frame: np.ndarray, vehicle_id: int, bbox: Tuple[int, int, int, int], 
                         is_runner: bool = False, light_status: str = "Green Light") -> None:
        """Draw bounding box and vehicle information on frame."""
        x1, y1, x2, y2 = bbox
        color = self.colors['vehicle_box']
        
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
        cv2.putText(frame, f"ID: {vehicle_id}", (x1, y1 - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        
        if is_runner:
            cv2.putText(frame, "Red light runner", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        elif light_status == "Green Light":
            cv2.putText(frame, "Car did not run red light", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    
    def draw_stats(self, frame: np.ndarray, stats: Dict) -> None:
        """Draw statistics on frame."""
        cv2.putText(frame, f"Light Status: {stats['light_status']}", (0, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.colors['text'], 1)
        cv2.putText(frame, f"Vehicles seen: {stats['total_vehicles']}", (0, 120),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.colors['text'], 1)
        cv2.putText(frame, f"Red light runner count: {stats['red_light_runners']}", (0, 140),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.colors['text'], 1)
        cv2.putText(frame, f"Run rate: %{stats['run_rate']}", (0, 160),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, self.colors['text'], 1)
        
        if 'detection_count' in stats:
            cv2.putText(frame, f"Detections: {stats['detection_count']}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, self.colors['detection_count'], 1)