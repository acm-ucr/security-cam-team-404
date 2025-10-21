# mqtt_publisher.py
import paho.mqtt.client as mqtt

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "yolo/logs"

client = mqtt.Client()
client.connect(BROKER, PORT, 60)

def send_log(message: str):
    """Send a log message to MQTT broker."""
    client.publish(TOPIC, message)

def close():
    """Disconnect when done."""
    client.disconnect()
