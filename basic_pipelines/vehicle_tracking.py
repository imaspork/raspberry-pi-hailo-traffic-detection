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
        self.counted_in_total = False

class VehicleTracker:
    def __init__(self):
        self.tracked_vehicles = {}
        self.next_id = 0
        self.max_frames_to_track = 30
        self.distance_threshold = 50

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