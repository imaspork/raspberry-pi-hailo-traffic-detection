# Standard library imports
import datetime
import json
import multiprocessing
import os
import socket
import sqlite3

# Third-party imports
import cv2
import gi
import psutil
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
from frame_processing import FrameProcessor

class user_app_callback_class(app_callback_class):
    """
    Handles the processing and tracking of vehicles in traffic monitoring system.
    
    This class extends app_callback_class to implement traffic light violation detection,
    vehicle tracking, and image capture of violations.
    """
    def __init__(self):
        super().__init__()
        self.db_manager = DatabaseManager()
        self.frame_processor = FrameProcessor()
        # Initialize counters
        self.pixel_count = multiprocessing.Value('i', 0)
        self.frame_count = 0
        self.red_light_runner_count = 0
        self.total_vehicles_seen = 0
        self.saved_image_count = 0
        self.max_in_green = 0
        self.red_light_trigger_check = False
        self.detection_buffer = []
        
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
    if not hasattr(user_data, 'publisher') or user_data.publisher is None:
        user_data.setup_publisher()
    buffer = info.get_buffer()
    if buffer is None:
        return Gst.PadProbeReturn.OK
    

    user_data.increment()
    user_data.frame_count += 1

    print(f"Amount of red detected: {user_data.pixel_count.value}")

    format, width, height = get_caps_from_pad(pad)
    frame = None
    if user_data.use_frame and format and width and height:
        frame = user_data.frame_processor.setup_frame(buffer, format, width, height)
    

    # every 500 frames parse for a new received zone
    if user_data.get_count() % 500 == 0:
        user_data.zone_manager.update_zones()
        

    if user_data.use_frame and frame is not None:
        # Draw zones and process frame for traffic light detection
        user_data.zone_manager.draw_zones(frame)
        
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_bound = np.array([55, 68, 40])
        upper_bound = np.array([172, 196, 255])
        color_mask = cv2.inRange(hsv_frame, lower_bound, upper_bound)
        zone_mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillPoly(zone_mask, [user_data.zone_manager.get_zone('traffic_zone')], 255)

        # Process vehicle detections
        relevant_detections, detection_count = user_data.frame_processor.process_detections(
            buffer, width, height, user_data.zone_manager
        )


        # Add detection smoothing
        buffer_size = 5  # Adjust based on frame rate

        if len(user_data.detection_buffer) >= buffer_size:
            user_data.detection_buffer.pop(0)
        user_data.detection_buffer.append(detection_count)

        smoothed_count = sum(user_data.detection_buffer) / len(user_data.detection_buffer)
        user_data.max_in_green = max(user_data.max_in_green, smoothed_count)
        if smoothed_count < user_data.max_in_green:
            user_data.red_light_trigger_check = True  
        

        # Update vehicle tracker
        user_data.vehicle_tracker.update(user_data.frame_count, relevant_detections, width, height)

        # Process tracked vehicles
        for vehicle_id, vehicle in user_data.vehicle_tracker.get_active_vehicles().items():
            # Update vehicle totals and database
            if user_data.zone_manager.is_in_zone(user_data.zone_manager.get_zone('red_zone'), vehicle.center_point):
                if not vehicle.counted_in_total:
                    user_data.total_vehicles_seen += 1
                    vehicle.counted_in_total = True
                    user_data.db_manager.record_vehicle(
                        is_runner=(user_data.light_status == "Red Light")
                    )
                
                # Handle red light runners
                if user_data.light_status == "Red Light" and not vehicle.counted_as_runner:
                    if user_data.red_light_trigger_check:
                        user_data.red_light_runner_count += 1
                        # Remove this line to allow multiple detections:
                        # user_data.red_light_trigger_check = False
                        user_data.max_in_green = smoothed_count  # Update baseline after violation
                    vehicle.counted_as_runner = True
                    
                    # Save violation image if needed
                    if user_data.saved_image_count < MAX_SAVED_IMAGES and not vehicle.red_light_image_saved:
                        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")
                        filename = os.path.join(OUTPUT_DIR, f"{timestamp}_red_light_runner_id_{vehicle_id}.jpg")
                        saved_converted_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        cv2.imwrite(filename, saved_converted_rgb)
                        vehicle.red_light_image_saved = True
                        user_data.saved_image_count += 1
                        print(f"Saved red light runner image: {filename}")
                    elif user_data.saved_image_count >= MAX_SAVED_IMAGES:
                        print("Image save limit reached. No more images will be saved.")
                            # Draw vehicle information
                user_data.frame_processor.draw_vehicle_info(
                    frame, 
                    vehicle_id, 
                    vehicle.bbox,
                    is_runner=(vehicle.counted_as_runner),
                    light_status=user_data.light_status
                )



        # Draw statistics
        stats = {
            'light_status': user_data.light_status,
            'total_vehicles': user_data.total_vehicles_seen,
            'red_light_runners': user_data.red_light_runner_count,
            'run_rate': user_data.run_rate,
            'detection_count': detection_count
        }
        user_data.frame_processor.draw_stats(frame, stats)

        # Prepare frame for output
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        user_data.set_frame(frame)

        # Prepare and publish metadata
        metadata = {
            'frame_count': user_data.frame_count,
            'light_status': user_data.light_status,
            'total_vehicles': user_data.total_vehicles_seen,
            'red_light_runners': user_data.red_light_runner_count,
            'run_rate': user_data.run_rate,
        }
        user_data.publisher.publish_frame_with_metadata(frame, metadata)

    return Gst.PadProbeReturn.OK


def check_port_usage(port=5555):
    """Check what process is using the port"""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            connections = psutil.Process(proc.info['pid']).connections()
            for conn in connections:
                if conn.laddr.port == port:
                    print(f"Process using port {port}:")
                    print(f"PID: {proc.info['pid']}")
                    print(f"Name: {proc.info['name']}")
                    print(f"Command: {' '.join(proc.info['cmdline'] or [])}")
                    return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return False

def is_port_in_use(port=5555):
    """Test if a port is in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0
    

if __name__ == "__main__":
    # Check port status before starting
    if is_port_in_use(5555):
        print("Port 5555 is already in use!")
        check_port_usage(5555)
    else:
        print("Port 5555 is available")
    
    user_data = user_app_callback_class()
    app = GStreamerDetectionApp(app_callback, user_data)
    try:
        app.run()
        print('app is running')
    finally:
        user_data.publisher.close()