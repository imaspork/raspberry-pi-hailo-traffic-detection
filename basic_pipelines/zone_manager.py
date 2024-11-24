import json
import numpy as np
from typing import Dict, List, Tuple, Optional
import cv2

class ZoneManager:
    """Manages traffic monitoring zones and their updates."""
    
    def __init__(self, default_zones: Dict[str, List[List[int]]]):
        self.zones = {
            'red_zone': np.array(default_zones['red_zone'], np.int32).reshape((-1, 1, 2)),
            'green_zone': np.array(default_zones['green_zone'], np.int32).reshape((-1, 1, 2)),
            'traffic_zone': np.array(default_zones['traffic_zone'], np.int32).reshape((-1, 1, 2))
        }
        
        self.fallback_zones = {
            'red_zone': [[80, 382], [160, 410], [138, 430], [80, 405]],
            'traffic_zone': [[160, 370], [180, 370], [180, 340], [160, 340]],
            'green_zone': [[210, 420], [555, 530], [560, 590], [165, 425]]
        }
    
    def get_zone(self, zone_name: str) -> np.ndarray:
        """Get a specific zone's numpy array."""
        return self.zones[zone_name]
    
    def update_zones(self) -> None:
        """Update zones from JSON files if available."""
        for zone_name in ['red_zone', 'green_zone', 'traffic_zone']:
            try:
                with open(f'{zone_name}.json', 'r') as file:
                    data = json.load(file)
                    self.zones[zone_name] = np.array(data, np.int32).reshape((-1, 1, 2))
                    print(f'new {zone_name} set', data)
            except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
                print(f"Error loading {zone_name}: {e}")
                self.zones[zone_name] = np.array(
                    self.fallback_zones[zone_name], 
                    np.int32
                ).reshape((-1, 1, 2))
                print(f'fallback {zone_name} set')
    
    @staticmethod
    def is_in_zone(zone: np.ndarray, point: Tuple[int, int]) -> bool:
        """Check if a point is inside a zone."""
        return cv2.pointPolygonTest(zone, point, False) >= 0
    
    def draw_zones(self, frame: np.ndarray) -> None:
        """Draw all zones on the frame."""
        cv2.polylines(
            frame, 
            [self.zones['green_zone']], 
            isClosed=True, 
            color=(0, 240, 44), 
            thickness=1
        )
        cv2.polylines(
            frame, 
            [self.zones['red_zone']], 
            isClosed=True, 
            color=(255, 0, 0), 
            thickness=1
        )
        cv2.polylines(
            frame, 
            [self.zones['traffic_zone']], 
            isClosed=True, 
            color=(0, 255, 255), 
            thickness=1
        )