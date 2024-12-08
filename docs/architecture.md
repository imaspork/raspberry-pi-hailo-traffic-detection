## Using YOLOv8 with Python

In this example, we're going to be using yolo files that have been converted to HEF (Hailo Executable Format) files. This enables us to utilize the full computing power of the Hailo chip. This particular step enables the python detection script to go from a measly 5-10 fsp to 30-60 depending on the frame. In this particular repo I have opted for the yolov8s_h8l model. This gives us a balance between performance and resolution since we will be streaming the frame directly.

**Software**:

- OS: Raspberry Pi
- Hailo RT version: 4.18.0

### App intercommunication

We have a total of 3 applications in this repo.

- The main application is the `/basic_pipelines/detections.py` file. This handles the core logic and classes for the detection and tracking.
- The second application is the Fast API server `main.py` file. This serves as middleware between the main application and the client application.
- The third application is a the web client. This is a NextJS (React) application that handles the user interface and receiving of the websocket stream from the Fast API application.

### Detecting cars

Thankfully cars are a very common object to detect and be available in class lists among yolo models. If you are attmepting to use a model that does not contain cars, you can retrain your model by following [these instructions](https://github.com/hailo-ai/hailo-rpi5-examples/blob/main/doc/retraining-example.md).

We follow a simple method of keeping track of cars based on their zone. We have 3 currently, but 2 is the most idea. We have a `green_zone`. This is the zone where a car is allowed to be and never violates any rule. We next have a `traffic_zone`, this is the zone for where your specific traffic light is. This zone is imperative for tracking if a light is red or green as we utilize some filtering methods to keep a count of how many red pixels exist in this zone within a finite range. If we detect more than 0 or 1, we may have a red light on our hands. Lastly, we have a `red_zone`. This is the zone where a car is not allowed to be if the light is red. However it's imperative to note that just because a car is in this zone does not mean it's violating the rule. Below is a short description of how our detection works.

When analyzing frames, we keep track of a maximum amount of cars seen in the green zone when the light is red. This tells us that there should be x amount of cars while the light is red. If the current detection count ever drops below that maximum, we've either dropped frames or a car has left the zone. This presents a few edgecases - A car has turned around - The detection script has dropped it's tracking of a car - The car has ran a yellow without running a red

I have chosen to not address a car turning around as this is a 2 lane road with no left or right turns, making that edgecase very very small (and illegal).

The tracking of the car being dropped is a valid concern that I pursued further. My chosen solution was to implement frame smoothing. This means our maximum detection takes into account the average of 5 frames to determine a new count/maximum. This should alleviate the possibilities of a car temporarily losing tracking.

The last edgecase is a car running a yellow without running a red. I found this as a valid edgecase to follow up on as it could directly impact the results of our detections. I chose to implement a simple solution of not checking for the maximum of the cars _until_ the light is red. This enables drivers to in a way, escape the zone and not become a statistic.

### Streaming the detection

Streaming the detection is a simple process. We utilize websockets to stream to the client by utilizing our middleware server. Our detection script will stream frames with the `frame_publisher` directly to the Fast API server. This server will receive the frames and metadata and forward it to the web client.

### Data Collection

Given we are using a simple raspberry pi, I have opted to use the simple approach of using sqlite to follow the theme. Data persistence is the current largest worry as if a corruption happens, we lose all collected data. It would be wise to implement either a backup system to save the collected data to the cloud in the chance of corruption. For the simplicity of this project I have opted _not to do that_.

In regards to data, there are a few data points I was interested in collecting.

- The total seen car count
- The total violation count
- The time of the violation

Given as all three of these 3 data points are related, I have opted to store them on a single record. Each time we see a vehicle, we store this in the database. We store the vehicle id, the time it was counted, and if it was counted as a violator. This allows us to easily query the data and get the total seen car count, total violation count, and the time of the violation.

Further data collection options include:

- The type of vehicle
- The model of the vehicle
- The license plate of the offending vehicle

### Future ideas to be implemented

- Implement an additional 4k camera to capture the license plate of the offending vehicle. This would require a separate pipeline to process pulling the license plate from the frame with the offending vehicle.
- Implement a leaderboard system on the webclient that tallys up the biggest offenders by license plate.
- Implement a system to pull vehicle information with the license plate. This would require a separate API to pull the vehicle information from.
- Implement a further dynamic version of data visualization to explore complex graphinng and data analysis.
