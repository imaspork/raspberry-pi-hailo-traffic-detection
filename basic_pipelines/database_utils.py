import sqlite3
from typing import Union
from pathlib import Path

class DatabaseManager:
    """Handles all database operations for vehicle tracking."""
    
    def __init__(self, db_path: Union[str, Path] = 'traffic.db'):
        self.db_path = str(db_path)
        self._init_db()
    
    def _init_db(self) -> None:
        """Initialize the database with required tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vehicle_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                vehicle_count INTEGER,
                is_red_light_runner BOOLEAN
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def record_vehicle(self, is_runner: bool = False) -> None:
        """
        Record a vehicle detection in the database.
        
        Args:
            is_runner (bool): Whether the vehicle ran a red light
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO vehicle_tracking (vehicle_count, is_red_light_runner)
            VALUES (?, ?)
        ''', (1, is_runner))
        
        conn.commit()
        conn.close()