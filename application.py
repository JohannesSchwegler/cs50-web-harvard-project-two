import os
import datetime
import simplejson as json
import time
from flask import Flask, render_template, jsonify, request, session, url_for,redirect, send_from_directory, send_file,  make_response
from flask_socketio import SocketIO, emit, join_room, leave_room,send
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
socketio = SocketIO(app)

MESSAGES_LIMIT = 100

fileName=None
messages = {}
users_online_global = set()


def init():
    messages["Lounge"] = {
            "users": set(),
            "messages": []
        }


@app.route("/")
def index():
    return render_template('home.html', message = "Willkommen zurück")
       

@app.route("/about")
def about():
    
    return render_template('about.html')


@app.route("/chat")
def chat():
    return render_template('chat.html', rooms=messages)    


@app.route("/get-file/", methods=["GET"])
def get_file():
    

    file =request.args.get("file")
    with open(os.path.join(app.config['UPLOAD_FOLDER'], file), 'rb') as f:
        data = f.read()
    return data 

  
    


@app.route("/receive-file/", methods=["POST"])
def receive_file():
    
    file = request.files["file"]
    
    type=file.content_type
   
    if file.filename == "":
        return jsonify({"message": "empty file name"}), 204
    filename = secure_filename(file.filename)
    fileName=filename
    new_filename = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(new_filename):
        # File already exists
        pass
     
    file.save(new_filename)

    #data=getBytes(filename)
    
    return jsonify({"message": "file saved",
                    "filename": filename}), 201
    
    
    return render_template('chat.html', rooms=messages)  

@socketio.on("user connected")
def connected(data):
    session["username"]=data["username"]
    username= data["username"]
    users_online_global.add(username)



@socketio.on("submit message")
def vote(data):
    room=data["room"]
    username=data["username"]
    message=data["message"]
    date=data["date"]
    upload=data["upload"]
    if room not in messages:
       messages[room] = {
           "users": set(),
           "messages": []
       }
   
    messages[room]["messages"].append({
        "username": username,
        "message": message,
        "date": date,
        "upload":upload
    })
    if len(messages[room]["messages"]) > MESSAGES_LIMIT:
        messages[room]["messages"] = messages[room]["messages"][-MESSAGES_LIMIT:]
   
    result = json.dumps(messages, default=set_default)
    emit("display message",data ,room=room)    



@socketio.on("submit room")
def channel_created(data):
    room = data["room"]
    if room not in messages:
        messages[room] = {
            "users": set(),
            "messages": []
        }
    emit("update rooms",data, broadcast=True)



@socketio.on("join")
def channel_entered(data):
    print(data)
    room = data["room"]
    username = data["username"]
    join_room(room)
    messages[room]["users"].add(username)
   
    result = json.dumps(messages, default=set_default)
    emit("join room",result,room=room) 


@socketio.on("leave")
def channel_leaved(data):
    room = data["room"]
    username = data["username"]
    leave_room(room)
    messages[room]["users"].discard(username)
    emit("user leaved",
         {"room":room,
          "username": username,
          "timestamp": time.time()},
         room=room)

def set_default(obj):
    if isinstance(obj, set):
        return list(obj)
    raise TypeError


@socketio.on("file sent")
def test(data):
    print(data)
    room=data["room"]
    username=data["username"]
    print(data["file"])
    message=data["file"]
    date=data["date"]
    upload=data["upload"]

    if room not in messages:
       messages[room] = {
           "users": set(),
           "messages": []
       }
   
    messages[room]["messages"].append({
        "username": username,
        "message": message,
        "date": date,
        "upload":upload

    })
    if len(messages[room]["messages"]) > MESSAGES_LIMIT:
        messages[room]["messages"] = messages[room]["messages"][-MESSAGES_LIMIT:]
   
    result = json.dumps(messages, default=set_default)
    emit("display upload",{"room":room,"username":username, "message":message, "date":date,"upload":upload} ,room=room)  




def getBytes(file):
    print(file)
    #data=json.dumps(send_from_directory(app.config['UPLOAD_FOLDER'],file))
    with open(os.path.join(app.config['UPLOAD_FOLDER'], file), 'rb') as f:
        data = f.read()
    return data 

@socketio.on("test")
def test(data):
    print(data)
    file=data["filename"]
    emit("test",getBytes(file))



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
    init()
    socketio.run(app)

  
