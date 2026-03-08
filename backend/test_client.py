import socketio

sio = socketio.Client()


@sio.event
def connect():
    print("✅ Connected to server!")
    print("Sending create_room event...")
    sio.emit("create_room", {"nickname": "TestHost", "time_limit_seconds": 180})


@sio.on("room_created")
def on_room_created(data):
    print(f"🎉 Room Successfully Created!")
    print(f"Room Data: {data}")
    print(f"Your PIN is: {data['pin']}")
    sio.disconnect()


@sio.event
def disconnect():
    print("❌ Disconnected from server.")


if __name__ == "__main__":
    sio.connect("http://localhost:8000")
    sio.wait()
