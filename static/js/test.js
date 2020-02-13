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
    document.querySelectorAll(".cc-input button").forEach(button => {
      button.onclick = () => {
        const message = document.querySelector(".cc-input input").value;

        socket.emit("submit message", {
          message: message,
          username: localStorage.username,
          room: room,
          date: new Date()
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

    // Room selection
    addClickToRooms();
  });
  // Render new rooms
  socket.on("update rooms", data => {
    document.querySelector(".cc-chanels");
    var p = document.createElement("p");
    p.classList.add("cc-select-room");
    p.innerHTML = data.room;
    document.querySelector(".cc-chanels").append(p);
    addClickToRooms();
  });

  socket.on("join room", data => {
    document.querySelector(".cc-messageBoard").innerHTML = "";
    let response = JSON.parse(data);
    let messages = response[room].messages;
    messages.forEach(data => {
      const div = document.createElement("div");
    
      const date = formatDate(new Date());
      data.username!==username ?   div.classList.add("ms", "ml") :  div.classList.add("ms");
      div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br> ${data.message}`;
      document.querySelector(".cc-messageBoard").append(div);
    });
  });

  socket.on("display message", data => {

    const div = document.createElement("div");
   
    const date = formatDate(new Date());
    console.log(data.username!==username);
    data.username!==username ?   div.classList.add("ms", "ml") :  div.classList.add("ms");
    div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br> ${data.message}`;
    document.querySelector(".cc-messageBoard").append(div);
  });
  // Scroll chat window down
  function scrollDownChatWindow() {
    const chatWindow = document.querySelector("#display-message-section");
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Print system messages
  function printSysMsg(msg) {
    const p = document.createElement("p");
    p.setAttribute("class", "system-msg");
    p.innerHTML = msg;
    document.querySelector(".cc-messageBoard").append(p);
    // scrollDownChatWindow()
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
          leaveRoom(room);
          room = newRoom;
          joinRoom(room);
          document.querySelector(".cc-messageBoard").innerHTML = "";

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
    console.log(room);
  }
});
