# Standard library imports
import datetime
import json
import multiprocessing
import os
import sqlite3

# Third-party imports
import cv2
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
import hailo
import numpy as np
import zmq

# Local imports
from hailo_rpi_common import (
    get_caps_from_pad,
    get_numpy_from_buffer,
    app_callback_class,
)
from detection_pipeline import GStreamerDetectionApp
from frame_publisher import FramePublisher
from vehicle_tracking import TrackedVehicle, VehicleTracker
from config import (
    DEFAULT_ZONES,
    OUTPUT_DIR,
    MAX_SAVED_IMAGES,
    ZONE_UPDATE_INTERVAL,
)
from database_utils import DatabaseManager
from zone_manager import ZoneManager

class user_app_callback_class(app_callback_class):
    """
    Handles the processing and tracking of vehicles in traffic monitoring system.
    
    This class extends app_callback_class to implement traffic light violation detection,
    vehicle tracking, and image capture of violations.
    """
    def __init__(self):
        super().__init__()
        self.db_manager = DatabaseManager()
        # Initialize counters
        self.pixel_count = multiprocessing.Value('i', 0)
        self.frame_count = 0
        self.red_light_runner_count = 0
        self.total_vehicles_seen = 0
        self.saved_image_count = 0
        self.max_in_green = 0
        
        # Initialize zones from config
        self.zone_manager = ZoneManager(DEFAULT_ZONES)
        
        # Initialize tracking and publishing components
        self.vehicle_tracker = VehicleTracker()
        self.publisher = FramePublisher()
        
        # Create output directory if it doesn't exist
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
    
    def __del__(self):
        """Cleanup when object is destroyed."""
        if hasattr(self, 'publisher'):
            self.publisher.close()
    
    @property
    def run_rate(self):
        """Calculate the percentage of vehicles that run red lights"""
        if self.total_vehicles_seen == 0:
            return 0.0
        return round((self.red_light_runner_count / self.total_vehicles_seen) * 100, 2)
    
    @property
    def light_status(self):
        """Return current traffic light status based on pixel count"""
        if self.pixel_count.value == 0:
            self.max_in_green = 0
            return "Green Light"
        return "Red Light"

# -----------------------------------------------------------------------------------------------
# User-defined class to be used in the callback function
# -----------------------------------------------------------------------------------------------
# Inheritance from the app_callback_class
def app_callback(pad, info, user_data):
    buffer = info.get_buffer()
    if buffer is None:
        return Gst.PadProbeReturn.OK

    user_data.increment()
    user_data.frame_count += 1

    format, width, height = get_caps_from_pad(pad)
    frame = None
    if user_data.use_frame and format and width and height:
        frame = get_numpy_from_buffer(buffer, format, width, height)
    

    # every 500 frames parse for a new received zone
    if user_data.get_count() % 500 == 0:
        user_data.zone_manager.update_zones()
        

    if user_data.use_frame:

        user_data.zone_manager.draw_zones(frame)
        
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_bound = np.array([55, 68, 40])
        upper_bound = np.array([172, 196, 255])
        color_mask = cv2.inRange(hsv_frame, lower_bound, upper_bound)


        zone_mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillPoly(zone_mask, [user_data.zone_manager.get_zone('traffic_zone')], 255)

    cv2.putText(frame, user_data.light_status, (0, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)

    # Process detections
    roi = hailo.get_roi_from_buffer(buffer)
    detections = roi.get_objects_typed(hailo.HAILO_DETECTION)
    detection_count = 0


    # Filter detections to only include cars in relevant zones
    relevant_detections = []
    for detection in detections:
        if detection.get_label() == "car":
            bbox = detection.get_bbox()
            x1, y1 = int(bbox.xmin() * width), int(bbox.ymin() * height)
            x2, y2 = int(bbox.xmax() * width), int(bbox.ymax() * height)
            car_center = (x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2)
            
            if (user_data.zone_manager.is_in_zone(user_data.zone_manager.get_zone('green_zone'), car_center) or 
                user_data.zone_manager.is_in_zone(user_data.zone_manager.get_zone('red_zone'), car_center)):
                relevant_detections.append(detection)
                detection_count += 1
                user_data.max_in_green = max(user_data.max_in_green, detection_count)

    # Update tracker with new detections
    user_data.vehicle_tracker.update(user_data.frame_count, relevant_detections, width, height)

    # Process tracked vehicles
    for vehicle_id, vehicle in user_data.vehicle_tracker.get_active_vehicles().items():
        x1, y1, x2, y2 = vehicle.bbox
        car_center = vehicle.center_point
        
        color = (50, 180, 0)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
        
        # Add vehicle ID to the display
        cv2.putText(frame, f"ID: {vehicle_id}", (x1, y1 - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Check for red light runners
        if user_data.zone_manager.is_in_zone(user_data.zone_manager.get_zone('red_zone'), car_center):
            if not vehicle.counted_in_total:
                user_data.total_vehicles_seen += 1
                vehicle.counted_in_total = True
                if user_data.light_status == "Red Light":
                    user_data.db_manager.record_vehicle(is_runner=True)
                else:
                    user_data.db_manager.record_vehicle(is_runner=False)

                
            if user_data.light_status == "Red Light" and not vehicle.counted_as_runner:
                user_data.red_light_runner_count += 1
                vehicle.counted_as_runner = True

                
                # Save frame if we haven't saved one for this vehicle yet
                if user_data.saved_image_count < 200:
                    if not vehicle.red_light_image_saved:
                        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
                        # filename = os.path.join(user_data.output_dir, f"red_light_runner_id_{vehicle_id}_{timestamp}.jpg")
                        filename = os.path.join(user_data.output_dir, f"{timestamp}_red_light_runner_id_{vehicle_id}.jpg")
                        saved_converted_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        cv2.imwrite(filename, saved_converted_rgb)
                        vehicle.red_light_image_saved = True
                        user_data.saved_image_count += 1
                        print(f"Saved red light runner image: {filename}")
                else:
                    print("Image save limit reached. No more images will be saved.")
                
                cv2.putText(frame, "Red light runner", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            elif user_data.light_status == "Green Light":
                cv2.putText(frame, "Car did not run red light", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
    cv2.putText(frame, f"Vehicles seen: {user_data.total_vehicles_seen}", (0, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)
    cv2.putText(frame, f"Red light runner count: {user_data.red_light_runner_count}", (0, 140),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)
    cv2.putText(frame, f"Run rate: %{user_data.run_rate}", (0, 160),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)

    if user_data.use_frame:
        cv2.putText(frame, f"Detections: {detection_count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 1)
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        user_data.set_frame(frame)

    metadata = {
        'frame_count': user_data.frame_count,
        'light_status': user_data.light_status,
        'total_vehicles': user_data.total_vehicles_seen,
        'red_light_runners': user_data.red_light_runner_count,
        'run_rate': user_data.run_rate,
    }

    if frame is not None:
        user_data.publisher.publish_frame_with_metadata(frame, metadata)

    return Gst.PadProbeReturn.OK

if __name__ == "__main__":
    user_data = user_app_callback_class()
    app = GStreamerDetectionApp(app_callback, user_data)
    try:
        app.run()
        print('app is running')
    finally:
        user_data.publisher.close()