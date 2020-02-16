document.addEventListener("DOMContentLoaded", () => {
  //Connect to websocket
  var socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  // Retrieve username
  const username = localStorage.username;

  // Set default room
  let room = "Lounge";

  if (localStorage.getItem("lastRoom") !== null) {
    room = localStorage.getItem("lastRoom");
    joinRoom(localStorage.getItem("lastRoom"));
  } else {
    joinRoom("Lounge");
  }

  (function setup() {
    let rooms = document.querySelectorAll(".cc-select-room");
    rooms.forEach(item => {
      if (item.innerHTML === room) {
        item.classList.add("current");
      }
    });
  })();

  var currentUsers = 0;
  //when connected, configure buttons
  socket.on("connect", data => {
    ++currentUsers;
    document.querySelectorAll(".cc-input .sendMessage").forEach(button => {
      button.onclick = () => {
        const message = document.querySelector(".cc-input .cc-username").value;
        if (message === "") {
          return;
        }
        socket.emit("submit message", {
          message: message,
          username: localStorage.username,
          room: room,
          date: new Date(),
          upload: false
        });
      };
    });

    //Room Creation
    document.getElementById("create-room").onclick = () => {
      const roomName = document.querySelector(".cc-createChannel").value;
      var isThere = false;
      document.querySelectorAll(".cc-select-room").forEach(item => {
        if (item.innerHTML.toLowerCase() === roomName.toLowerCase()) {
          isThere = true;
          return;
        }
      });

      if (isThere) {
        return;
      }
      // check if roomname exits

      socket.emit("submit room", {
        username: localStorage.username,
        room: roomName
      });
    };

    //Send file
    document.querySelector(".sendFile").addEventListener("click", function() {
      var file = document.querySelector(".chooseFile").files[0];

      sendFile(file);
    });
    // Room selection

    // Render new rooms
    socket.on("update rooms", data => {
      document.querySelector(".cc-chanels");
      var p = document.createElement("p");
      p.classList.add("cc-select-room");
      p.innerHTML = data.room;
      document.querySelector(".cc-chanels").append(p);
      addClickToRooms();
    });
    addClickToRooms();
  });

  socket.on("join room", data => {
    console.log(data);

    if (data[1] === username) {
      document.querySelector(".cc-messageBoard").innerHTML = "";
      let response = JSON.parse(data[0]);
      let messages = response[room].messages;
  
      messages.forEach(message => {
        displayMessages(message);
      });
  
    }

 
    const p = document.createElement("p");
    p.classList.add("ms-status");
    p.innerHTML = `${data[1]} has connected`;
    document.querySelector(".cc-messageBoard").append(p);
  });

  socket.on("user leaved", data => {
    console.log(data);
    const p = document.createElement("p");
    p.classList.add("ms-status");
    const date = formatDate(new Date());
    p.innerHTML = `${data.username} has disconnected`;
    document.querySelector(".cc-messageBoard").append(p);
  });

  socket.on("display message", data => {
    console.log(data);
    displayMessages(data);
  });

  socket.on("display upload", data => {
    displayMessages(data);
  });

  function displayMessages(data) {
    const div = document.createElement("div");
    const date = formatDate(new Date());

    data.username !== username
      ? div.classList.add("ms", "ml")
      : div.classList.add("ms");

    if (data["upload"] === true) {
      div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br> `;

      const a = document.createElement("a");
      a.classList.add("ms-upload");
      a.setAttribute("download", "");
      a.setAttribute("href", `/static/uploads/${data.message}`);
      a.innerHTML = `<span class="ms-message">${data.message}</span>`;
      div.append(a);
    } else {
      div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br> ${data.message}`;
    }

    document.querySelector(".cc-messageBoard").append(div);
  }

  // Print system messages
  function printSysMsg(msg) {
    const p = document.createElement("p");
    p.setAttribute("class", "system-msg");
    p.innerHTML = msg;
    document.querySelector(".cc-messageBoard").append(p);
  }

  function formatDate(date) {
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    minutes = minutes.toString().length === 1 ? `0${minutes}` : minutes;
    return (
      day +
      " " +
      monthNames[monthIndex] +
      " " +
      year +
      "   " +
      hours +
      ":" +
      minutes
    );
  }

  function addClickToRooms() {
    document.querySelectorAll(".cc-select-room").forEach(p => {
      p.onclick = function() {
        let rooms = document.querySelectorAll(".cc-select-room");

        rooms.forEach(item => {
          item.classList.remove("current");
        });
        this.classList.add("current");

        let newRoom = p.innerHTML;
        if (newRoom == room) {
          msg = `You are already in ${room} room.`;
          // printSysMsg(msg);
          console.log(`You are already in ${room} room.`);
          printSysMsg(msg);
        } else {
          document.querySelector(".cc-messageBoard").innerHTML = "";
          leaveRoom(room);
          room = newRoom;
          joinRoom(room);

          localStorage.lastRoom = newRoom;
        }
      };
    });
  }

  // Trigger 'leave' event if user was previously on a room
  function leaveRoom(room) {
    socket.emit("leave", { username: username, room: room });

    document.querySelectorAll(".select-room").forEach(p => {
      p.style.color = "black";
    });
  }

  // Trigger 'join' event
  function joinRoom(room) {
    socket.emit("join", { username: username, room: room });
  }

  function sendFile(file) {
    const request = new XMLHttpRequest();
    request.open("POST", "/receive-file/");

    request.onload = () => {
      if (request.status == 204) {
        // Received empty file name
        console.log("received");
      }
      if (request.status == 201) {
        const data = JSON.parse(request.responseText);

        socket.emit("file sent", {
          room: room,
          username: username,
          file: data.filename,
          date: new Date(),
          upload: true
        });
      }
    };
    var data = new FormData();
    data.append("file", file, file.name);
    request.send(data);
  }
});
