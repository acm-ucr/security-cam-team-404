# subscriber.py
import paho.mqtt.client as mqtt

broker = "broker.emqx.io"
port = 1883
topic = "test/topic"

# Called when a message is received
def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic: {msg.topic}")

client = mqtt.Client()
client.on_message = on_message

client.connect(broker, port, 60)
client.subscribe(topic)

print(f"Subscribed to {topic}. Waiting for messages...")
client.loop_forever()
