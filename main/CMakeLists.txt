idf_component_register(
    SRCS "main.c"  
    INCLUDE_DIRS "."
    REQUIRES 
        freertos 
        nvs_flash 
        esp_timer
        esp32-camera 
        driver          # For the LEDC/GPIO functions used
        lwip            # For networking functions
        esp_wifi        # For Wi-Fi functionality
        esp_http_server
    )