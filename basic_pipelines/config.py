DEFAULT_ZONES = {
    'red_zone': [[80, 382], [160, 410], [138, 430], [80, 405]],
    'green_zone': [[210, 420], [555, 530], [560, 590], [165, 425]],
    'traffic_zone': [[160, 370], [180, 370], [180, 340], [160, 340]]
}

OUTPUT_DIR = "red_light_runners"
MAX_SAVED_IMAGES = 200
ZONE_UPDATE_INTERVAL = 500  # frames