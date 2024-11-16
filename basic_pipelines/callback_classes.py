import multiprocessing


class app_callback_class:
    def __init__(self):
        self.frame_count = 0
        self.use_frame = True
        self.frame_queue = multiprocessing.Queue(maxsize=3)
        self.running = True
        self.red_light_runner_count = 0

    def increment(self):
        self.frame_count += 1

    def get_count(self):
        return self.frame_count

    def set_frame(self, frame):
        if not self.frame_queue.full():
            self.frame_queue.put(frame)

    def get_frame(self):
        if not self.frame_queue.empty():
            return self.frame_queue.get()
        else:
            return None