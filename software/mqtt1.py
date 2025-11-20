# mqtt_publisher.py
import paho.mqtt.client as mqtt

BROKER = "broker.emqx.io"
PORT = 1883
TOPIC = "yolo/logs"

client = mqtt.Client()
client.connect(broker, port, 60)


while True:
    message = input("Enter your message: ")
    client.publish(topic, message)

def close():
    """Disconnect when done."""
    client.disconnect()