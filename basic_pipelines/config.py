DEFAULT_ZONES = {
    'red_zone': [[80, 382], [160, 410], [138, 430], [80, 405]],
    'green_zone': [[210, 420], [555, 530], [560, 590], [165, 425]],
    'green_zone_2': [[210, 420], [555, 530], [560, 590], [165, 425]],
    'traffic_zone': [[177.0532989501953, 384.20062255859375], [192.10031127929688, 388.2131652832031], [189.09091186523438, 409.27899169921875], [178.05642700195312, 408.2758483886719]]
}

OUTPUT_DIR = "red_light_runners"
MAX_SAVED_IMAGES = 200
ZONE_UPDATE_INTERVAL = 500  # frames