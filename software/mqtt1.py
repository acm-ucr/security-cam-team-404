import paho.mqtt.client as mqtt

broker = "broker.emqx.io"
port = 1883
topic = "test/topic"
message = "Hello MQTT!"

client = mqtt.Client()
client.connect(broker, port, 60)
client.publish(topic, message)
client.disconnect()