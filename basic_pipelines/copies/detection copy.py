import multiprocessing
import gi
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


# -----------------------------------------------------------------------------------------------
# User-defined class to be used in the callback function
# -----------------------------------------------------------------------------------------------
# Inheritance from the app_callback_class
class user_app_callback_class(app_callback_class):
    def __init__(self):
        super().__init__()
        self.new_variable = 42  # New variable example
        self.red_light_runner_count = 0  # New variable example
        self.pixel_count = multiprocessing.Value('i', 0) 

    def new_function(self):  # New function example
        return "The meaning of life is: "
        

def app_callback(pad, info, user_data):
    buffer = info.get_buffer()
    if buffer is None:
        return Gst.PadProbeReturn.OK

    user_data.increment()
    # string_to_print = f"Frame count: {user_data.get_count()}\n"
    light_status = "Unknown"

    format, width, height = get_caps_from_pad(pad)
    frame = None
    if user_data.use_frame and format and width and height:
        frame = get_numpy_from_buffer(buffer, format, width, height)


        
        # color_count = cv2.countNonZero(combined_mask)
        # print(color_count)

        # # Check if there are any non-zero pixels in the combined mask
        # color_present_in_zone = color_count > 0

        # if color_present_in_zone:
        #     light_status = "Green Light"
        # else:
        #     light_status = "Red Light"

    # Define polygon zones
    zone_vertices = np.array([[210, 420], [555, 530], [560, 590], [165, 425]], np.int32).reshape((-1, 1, 2))
    zone_vertices_runners = np.array([[80, 385], [160, 410], [140, 430], [80, 405]], np.int32).reshape((-1, 1, 2))
    zone_vertices_light = np.array([[160, 370], [180, 370], [180, 340], [160, 340]], np.int32).reshape((-1, 1, 2))

    if user_data.use_frame:
    # Draw polygons to visualize zones
        cv2.polylines(frame, [zone_vertices], isClosed=True, color=(244, 44, 44), thickness=1)
        cv2.polylines(frame, [zone_vertices_runners], isClosed=True, color=(0, 0, 255), thickness=1)
        cv2.polylines(frame, [zone_vertices_light], isClosed=True, color=(0, 255, 255), thickness=1)
        
        hsv_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        lower_bound = np.array([55, 68, 40])
        upper_bound = np.array([172, 196, 255])
        color_mask = cv2.inRange(hsv_frame, lower_bound, upper_bound)
        zone_mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillPoly(zone_mask, [zone_vertices_light], 255)
        combined_mask = cv2.bitwise_and(color_mask, zone_mask)

        print("Pixel count in display_user_data_frame:", user_data.pixel_count.value)

        

        


    cv2.putText(frame, light_status, (0, 100),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)

    # Process detections as before
    roi = hailo.get_roi_from_buffer(buffer)
    detections = roi.get_objects_typed(hailo.HAILO_DETECTION)
    detection_count = 0

    def is_in_zone(zone, point):
        return cv2.pointPolygonTest(zone, point, False) >= 0

    for detection in detections:
        label = detection.get_label()
        bbox = detection.get_bbox()
        confidence = detection.get_confidence()
        
        if label == "car":
            x1, y1 = int(bbox.xmin() * width), int(bbox.ymin() * height)
            x2, y2 = int(bbox.xmax() * width), int(bbox.ymax() * height)
            car_center = (x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2)
            
            if is_in_zone(zone_vertices, car_center):
                string_to_print += f"Detection: {label} {confidence:.2f}\n"
                detection_count += 1

                color = (50, 180, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
                cv2.putText(frame, f"{label} {confidence:.2f}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
            if is_in_zone(zone_vertices_runners, car_center):
                string_to_print += f"Detection: {label} {confidence:.2f}\n"
                detection_count += 1

                color = (50, 180, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 1)
                if light_status == "Green Light":
                    cv2.putText(frame, "Car did not run red light", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                else:
                    user_data.red_light_runner_count += 1
                    # cv2.imwrite(f"runner_{user_data.red_light_runner_count}.png", frame)
                    cv2.putText(frame, "Red light runner", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                    
    cv2.putText(frame, f"Red light runner count: {user_data.red_light_runner_count}", (0, 120),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (55, 255, 255), 1)

    # Add detection count and text if frame processing is enabled
    if user_data.use_frame:
        cv2.putText(frame, f"Detections: {detection_count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 1)
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        user_data.set_frame(frame)

    # print(string_to_print)
    return Gst.PadProbeReturn.OK

if __name__ == "__main__":
    user_data = user_app_callback_class()
    app = GStreamerDetectionApp(app_callback, user_data)
    app.run()