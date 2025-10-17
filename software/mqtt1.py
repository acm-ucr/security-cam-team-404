import paho.mqtt.client as mqtt

broker = "broker.emqx.io"
port = 1883
topic = "test/topic"


client = mqtt.Client()
client.connect(broker, port, 60)


while True:
    message = input("Enter your message: ")
    client.publish(topic, message)

client.disconnect()
