import datetime
import json
import multiprocessing
import sqlite3
import gi
import zmq
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
import os
import numpy as np
import cv2
import hailo
from hailo_rpi_common import (
    get_caps_from_pad,
    get_numpy_from_buffer,
    app_callback_class,
)
from detection_pipeline import GStreamerDetectionApp

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


class TrackedVehicle:
    def __init__(self, detection_id, bbox, frame_first_seen, center_point):
        self.id = detection_id
        self.bbox = bbox
        self.frame_first_seen = frame_first_seen
        self.center_point = center_point
        self.counted_as_runner = False
        self.frames_tracked = 0
        self.last_seen = frame_first_seen
        self.red_light_image_saved = False
        self.counted_in_total = False  # New flag to track if vehicle has been counted


class VehicleTracker:
    def __init__(self):
        self.tracked_vehicles = {}
        self.next_id = 0
        self.max_frames_to_track = 30  # Maximum frames to keep tracking a vehicle
        self.distance_threshold = 50  # Maximum pixel distance to consider it's the same vehicle

    def update(self, current_frame_count, detections, width, height):
        # Convert detections to format we can use
        current_detections = []
        for detection in detections:
            bbox = detection.get_bbox()
            x1, y1 = int(bbox.xmin() * width), int(bbox.ymin() * height)
            x2, y2 = int(bbox.xmax() * width), int(bbox.ymax() * height)
            center = (x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2)
            current_detections.append({
                'bbox': (x1, y1, x2, y2),
                'center': center,
                'confidence': detection.get_confidence()
            })

        # Match existing tracks to new detections
        matched_tracks = set()
        matched_detections = set()

        for vehicle_id, vehicle in list(self.tracked_vehicles.items()):
            # Remove old tracks
            if current_frame_count - vehicle.last_seen > self.max_frames_to_track:
                del self.tracked_vehicles[vehicle_id]
                continue

            # Find the closest detection to this track
            min_dist = float('inf')
            closest_detection_idx = None

            for i, detection in enumerate(current_detections):
                if i in matched_detections:
                    continue

                dist = self._calculate_distance(vehicle.center_point, detection['center'])
                if dist < min_dist and dist < self.distance_threshold:
                    min_dist = dist
                    closest_detection_idx = i

            if closest_detection_idx is not None:
                # Update the track with new detection
                matched_detection = current_detections[closest_detection_idx]
                vehicle.bbox = matched_detection['bbox']
                vehicle.center_point = matched_detection['center']
                vehicle.last_seen = current_frame_count
                vehicle.frames_tracked += 1
                
                matched_tracks.add(vehicle_id)
                matched_detections.add(closest_detection_idx)

        # Create new tracks for unmatched detections
        for i, detection in enumerate(current_detections):
            if i not in matched_detections:
                new_vehicle = TrackedVehicle(
                    self.next_id,
                    detection['bbox'],
                    current_frame_count,
                    detection['center']
                )
                self.tracked_vehicles[self.next_id] = new_vehicle
                self.next_id += 1

    def _calculate_distance(self, point1, point2):
        return ((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2) ** 0.5

    def get_active_vehicles(self):
        return self.tracked_vehicles

class user_app_callback_class(app_callback_class):
    def __init__(self):
        super().__init__()
        self.new_variable = 42
        
        self.pixel_count = multiprocessing.Value('i', 0)
        self.vehicle_tracker = VehicleTracker()
        self.frame_count = 0
        self.red_light_runner_count = 0
        self.total_vehicles_seen = 0
        self.saved_image_count = 0
        self.red_zone = [[80, 382], [160, 410], [138, 430], [80, 405]]
        self.green_zone = [[210, 420], [555, 530], [560, 590], [165, 425]]
        self.traffic_zone = [[160, 370], [180, 370], [180, 340], [160, 340]]
        self.max_in_green = 0
        # Remove the direct division and replace with property
        self.output_dir = "red_light_runners"  # Directory to save images

        self.publisher = FramePublisher()
        # Create output directory if it doesn't exist
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
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
        if self.pixel_count.value == 0:
            self.max_in_green = 0
            return "Green Light"
        else: 
            return "Red Light"

    def new_function(self):
        return "The meaning of life is: "


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

    # Define polygon zones
    green_zone = np.array(user_data.green_zone, np.int32).reshape((-1, 1, 2))
    red_zone = np.array(user_data.red_zone, np.int32).reshape((-1, 1, 2))
    # traffic_zone = np.array([[160, 370], [180, 370], [180, 340], [160, 340]], np.int32).reshape((-1, 1, 2))
    traffic_zone = np.array(user_data.traffic_zone, np.int32).reshape((-1, 1, 2))
    

    # every 500 frames parse for a new received zone
    if user_data.get_count() % 500 == 0:
        fall_back_red = [[80, 382], [160, 410], [138, 430], [80, 405]]
        try:
            with open('red_zone.json', 'r') as file:
                data = json.load(file)
                # Convert JSON data to numpy array
                user_data.red_zone = data
                print('new zone set', data)
        except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
            # Use default vertices in case of error
            print(f"Error occurred: {e}")
            user_data.red_zone = np.array(fall_back_red, np.int32).reshape((-1, 1, 2))
            print('fallback zone set', data)

        fall_back_traffic_zone = [[160, 370], [180, 370], [180, 340], [160, 340]]
        try:
            with open('traffic_zone.json', 'r') as file:
                data = json.load(file)
                # Convert JSON data to numpy array
                user_data.traffic_zone = data
                print('new zone set', data)
        except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
            # Use default vertices in case of error
            print(f"Error occurred: {e}")
            user_data.traffic_zone = np.array(fall_back_traffic_zone, np.int32).reshape((-1, 1, 2))
            print('fallback zone set', data)

        fall_back_green = [[210, 420], [555, 530], [560, 590], [165, 425]]
        try:
            with open('green_zone.json', 'r') as file:
                data = json.load(file)
                # Convert JSON data to numpy array
                user_data.green_zone = data
                print('new zone set', data)
        except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
            # Use default vertices in case of error
            print(f"Error occurred: {e}")
            user_data.green_zone = np.array(fall_back_green, np.int32).reshape((-1, 1, 2))
            print('fallback zone set', data)
        

    if user_data.use_frame:
        # Draw polygons to visualize zones
        cv2.polylines(frame, [green_zone], isClosed=True, color=(0, 240, 44), thickness=1)
        cv2.polylines(frame, [red_zone], isClosed=True, color=(255, 0, 0), thickness=1)
        cv2.polylines(frame, [traffic_zone], isClosed=True, color=(0, 255, 255), thickness=1)
        
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        lower_bound = np.array([55, 68, 40])
        upper_bound = np.array([172, 196, 255])
        color_mask = cv2.inRange(hsv_frame, lower_bound, upper_bound)
        zone_mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillPoly(zone_mask, [traffic_zone], 255)

    cv2.putText(frame, user_data.light_status, (0, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)

    # Process detections
    roi = hailo.get_roi_from_buffer(buffer)
    detections = roi.get_objects_typed(hailo.HAILO_DETECTION)
    detection_count = 0

    def is_in_zone(zone, point):
        return cv2.pointPolygonTest(zone, point, False) >= 0

    # Filter detections to only include cars in relevant zones
    relevant_detections = []
    for detection in detections:
        if detection.get_label() == "car":
            bbox = detection.get_bbox()
            x1, y1 = int(bbox.xmin() * width), int(bbox.ymin() * height)
            x2, y2 = int(bbox.xmax() * width), int(bbox.ymax() * height)
            car_center = (x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2)
            
            if is_in_zone(green_zone, car_center) or is_in_zone(red_zone, car_center):
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
        if is_in_zone(red_zone, car_center):
            if not vehicle.counted_in_total:
                user_data.total_vehicles_seen += 1
                vehicle.counted_in_total = True
                if user_data.light_status == "Red Light":
                    record_vehicle(is_runner=True)
                else:
                    record_vehicle(is_runner=False)

                
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