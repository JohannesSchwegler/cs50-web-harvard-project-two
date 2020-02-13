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
      socket.emit("file sent", {
        room: room
      });
    });
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

      let upload = data["upload"] === true ? "Dies ist ein Upload" : "";
      const date = formatDate(new Date());
      data.username !== username
        ? div.classList.add("ms", "ml")
        : div.classList.add("ms");

      if (data["upload"] === true) {
        div.classList.add("upload");
      }
      div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br> <span class="ms-message">${data.message}</span>  ${upload}`;
      document.querySelector(".cc-messageBoard").append(div);
    });

    addEventsToUpload();
  });

  socket.on("test", data => {
    var a = _arrayBufferToBase64(data);
  });

  socket.on("display message", data => {
    console.log("display message");
    const div = document.createElement("div");
    const date = formatDate(new Date());

    data.username !== username
      ? div.classList.add("ms", "ml")
      : div.classList.add("ms");
    div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br> <span class="ms-message">${data.message}</span> `;
    document.querySelector(".cc-messageBoard").append(div);
  });

  socket.on("display upload", data => {
    console.log("display message");
    const div = document.createElement("div");
    const date = formatDate(new Date());
    let upload = data["upload"] === true ? "Dies ist ein Upload" : "";

    data.username !== username
      ? div.classList.add("ms", "ml")
      : div.classList.add("ms", "upload");
    div.innerHTML = `<span class="ms-user">${data.username}</span> <span class="ms-date">${date} </span> <br>  <span class="ms-message">${data.message}</span>   ${upload}`;
    document.querySelector(".cc-messageBoard").append(div);
    addEventsToUpload();
  });

  // Scroll chat window down
  function scrollDownChatWindow() {
    const chatWindow = document.querySelector("#display-message-section");
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Render new file
  socket.on("send file", data => {
    var blob = new Blob([new Uint8Array(data[0]).buffer]);

    var buffer = _arrayBufferToBase64(data[0]);
    const div = document.createElement("div");
    div.classList.add("ms");
    if (data[1] === "image/png" || data[1] === "image/jpg") {
      var image = new Image();
      image.src = `data:image/png;base64,${buffer}`;
      div.appendChild(image);
    } else if (data[1] === "application/pdf") {
      var link = document.createElement("a");
      link.href = `data:application/pdf;base64,${buffer}`;
      div.appendChild(link);
    }
    const span = document.createElement("span");
    span.innerHTML = data[2];

    document.querySelector(".cc-messageBoard").appendChild(div);
    document.querySelector(".cc-messageBoard").appendChild(span);
  });

  function blobToFile(theBlob, fileName) {
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
  }

  function _arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  //get files
  function addEventsToUpload() {
    document.querySelectorAll(".upload").forEach(item => {
      item.addEventListener("click", () => {
        let filename = item.childNodes[6].innerHTML;
        getFile(`${filename}`);
        socket.emit("test", { filename: filename });
      });
    });
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

    //data.append("channel_name", localStorage.getItem("channel"));
    request.send(data);

    /*var data = new FormData();
    data.append("file", file, file.name);
    data.append("channel_name", localStorage.getItem("channel"));
    request.send(data);
*/
  }

  function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.

    return new Promise((resolve, reject) => {
      resolve(
        btoa(
          encodeURIComponent(str).replace(
            /%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
              return String.fromCharCode("0x" + p1);
            }
          )
        )
      );
    });
  }

  function getFile(file) {
    console.log(typeof file);

    $.ajax({
      url: "/get-file/",
      data: {
        file: file
      },
      contentType: "application/json"
    }).done(function(response) {
      b64EncodeUnicode(response).then(data => {
        var image = new Image();
        image.src = `data:image/png;base64,${data}`;
        document.querySelector(".cc-messageBoard").append(image);
      });
      // _arrayBufferToBase64(response);
      // const data = JSON.stringify(response);
      /*
      const test = b64EncodeUnicode(data).then(data => {
        var image = new Image();
        image.src = `data:image/png;base64,${data}`;
        document.querySelector(".cc-messageBoard").append(image);
      });
*/
      // console.log(test);
    });

    //data.append("channel_name", localStorage.getItem("channel"));
  }

  function _arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    data = window.btoa(binary);
    var image = new Image();
    image.src = `data:image/png;base64,${data}`;
    var w = window.open("");
    w.document.write(image.outerHTML);
    //document.querySelector(".cc-messageBoard").append(image);
  }
});
