#!/bin/bash

# Source the virtual environment
source setup_env.sh

# Launch the image recognition app in the background
python basic_pipelines/detection.py --input /dev/video0 --use-frame &

# Store the PID of the first application
PID1=$!

# Launch the FastAPI app in the background
fastapi dev --host 0.0.0.0 main.py &

# Store the PID of the second application
PID2=$!

# Change to traffic-watcher directory and start npm
cd traffic-watcher
npm run dev &

# Store the PID of the npm process
PID3=$!

# Change back to original directory
cd ..

# Function to handle script termination
cleanup() {
    echo "Stopping applications..."
    kill $PID1 $PID2 $PID3
    exit
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "All applications are running. Press Ctrl+C to stop."
wait