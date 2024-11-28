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
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Store current local time
        cursor.execute('''
            INSERT INTO vehicle_tracking (timestamp, vehicle_count, is_red_light_runner)
            VALUES (datetime('now', 'localtime'), ?, ?)
        ''', (1, is_runner))
        
        conn.commit()
        conn.close()
