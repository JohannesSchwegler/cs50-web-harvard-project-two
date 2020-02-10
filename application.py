import os

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room,send

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)


MESSAGES_LIMIT = 100


messages = {}
users_online_global = set()
Rooms=["Lounge"]

@app.route("/")
def index():
    return render_template('home.html')

@app.route("/about")
def about():
    return render_template('about.html')


@app.route("/chat")
def chat():
    return render_template('chat.html',rooms=Rooms, messages=messages)    




@socketio.on("user connected")
def connected(data):
    print(data)
    user= data["user"]
    users_online_global.add(user)



@socketio.on("submit message")
def vote(data):
    room=data["room"]
    user=data["user"]
    message=data["message"]
    date=data["date"]
    if room not in messages:
       messages[room] = {
           "users": set(),
           "messages": []
       }
   
    messages[room]["messages"].append({
        "username": user,
        "message": message,
        "date": date
    })
    if len(messages[room]["messages"]) > MESSAGES_LIMIT:
        messages[room]["messages"] = messages[room]["messages"][-MESSAGES_LIMIT:]

    print(messages)
    emit("display message",data, broadcast=True)    



@socketio.on('submit room')
def submitRoom(data):
    Rooms.append(data["roomName"])
    emit("update rooms",data, broadcast=True)



@socketio.on('join')
def on_join(data):
    """User joins a room"""

    username = data["username"]
    room = data["room"]
    join_room(room)

    # Broadcast that new user has joined
    send({"msg": username + " has joined the " + room + " room."}, room=room)


@socketio.on('leave')
def on_leave(data):
    """User leaves a room"""

    username = data['username']
    room = data['room']
    leave_room(room)
    send({"msg": username + " has left the room"}, room=room)
  

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r    

if __name__ == '__main__':
    app.run(debug=True)

  
