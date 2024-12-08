## Understanding the detection.py file

Here we will go into a bit more depth of what the main detection file does. There are a few main classes we have broken it down into.

1. The Zone Manager Class

This could be argued as one of the most important classes in the application, as without it, we'd have object detection and nothing more. The Zone Manager class is responsible for managing the zones that are created by the user. It is also responsible for managing the objects that are detected in the zones. It was decided to go with a zone detection system for running red lights, as the view on my own webcam is too constructed to reliably train a model to determine if a car has ran a red light.

The Zone Manager class is responsible for the following:

- Retrieving the zones from local storage
- Updating zones
- Checking if an object is in a zone
- Drawing a zone

We store zone vertices locally in order to persist the zones between sessions. This is done using the `json` module in python. The zones are stored in the files `green_zone.json`,`green_zone2.json`, `red_zone.json`, `traffic_zone.json`. In my particular usecase I needed to utilize more than one zone for the traffic lane as a tree obstructs part of the view.

We update zones via an api call from the webclient --> FastAPI server --> detection.py. The detection.py file then updates the local storage with the new zone vertices.

We check if a vehicle is in a zone by utilizing cv2.pointPolygonTest.

We finally draw the zones.

2. The Vehicle Tracking Class

This class is responsible for tracking vehicles that are in the frame. We assign an id to each seen vehicle and increment the ids as the detection continues. This class is fairly simple and doesnt do much besides track a vehicle and increment the id we see. We keep the currently visible vehicles in a list and remove them from the list if they are no longer visible.

3. Frame Processing Class

This is also a relatively simple class that handles the frame processing and increments the detection count as we see vehicles.

The Frame Processing Class does the following:

- Frame processing
- Incrementing the detection count
- Drawing vehicle Info

4. Frame Publisher Class

This class is responsible for publishing the frame to the websocket server. It is also responsible for publishing metadata along with the frames such as vehicle count, frames processed, run rate %, violator count, and traffic light status.

The Frame Publisher Class does the following:

- Publish frame data and metadata to websocket server
- Closing the connection
- Checking for open ports
- Force closing existing ports to prevent conflicts

5. app_callback_class:

This class is the app callback class for the core video processing state. It handles the state of the video frame processing such as frame count, frame buffering with a queue.

# Config

There is a config file that is important to be on the radar. `config.py` Is the file we use to store default fallback zones, the output directory of the red light runners, the maximum amount of savable images (good to prevent runnning out of storage), and the zone interval timing. As the application is running, we poll the zone files to check for updates. We have set the default to every 500 frames to prevent this process from taking up too many resources. This accounts for roughly an 8-12 second delay in zone updates.

# Database

The database instance is created on the start of the application, and we utilize the file `database_utils.py` to handle our core database logic. This is exclusively writing to the database. In the class we handle initialization and recording of a vehicle.
