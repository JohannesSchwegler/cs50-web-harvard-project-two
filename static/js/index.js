document.addEventListener("DOMContentLoaded", () => {


    //Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port)


    // Retrieve username
    const username = localStorage.name;

    // Set default room
    let room = "Lounge"
    joinRoom("Lounge");


    var currentUsers = 0;
    //when connected, configure buttons
    socket.on("connect", () => {
        ++currentUsers;
        document.querySelectorAll('.cc-input button').forEach(button => {
            button.onclick = () => {
                const message = document.querySelector('.cc-input input').value;
                socket.emit('submit message', { 'message': message, "user": localStorage.name, "room": room });
            }
        });

        document.getElementById('create-room').onclick = () => {
            const message = document.querySelector('.cc-createChannel').value;
            console.log(message);
            socket.emit('submit room', { 'message': message, "user": localStorage.name, "room": room });
        }


    })





    //when connected, configure buttons
    socket.on("display message", data => {
        const li = document.createElement('li');
        const date = formatDate(new Date());
        li.innerHTML = `Nachricht am ${date}: <br> ${data.message} <br> User: ${data.user}<br> Room: ${data.room} `;
        document.querySelector('#votes').append(li)
    })



    // Room selection

    document.querySelectorAll('cc-select-room').forEach(p => {
        p.onclick = () => {
            let newRoom = p.innerHTML;
            if (newRoom == room) {
                msg = `You are already in ${room} room.`
                printSysMsg(msg);
            } else {
                leaveRoom(room);
                joinRoom(room);
                room = newRoom;
            }

        }
    })

    // Trigger 'leave' event if user was previously on a room
    function leaveRoom(room) {
        socket.emit('leave', { 'username': username, 'room': room });

        document.querySelectorAll('.select-room').forEach(p => {
            p.style.color = "black";
        });
    }

    // Trigger 'join' event
    function joinRoom(room) {

        // Join room
        socket.emit('join', { 'username': username, 'room': room });

        // Highlight selected room
        //document.querySelector('#' + CSS.escape(room)).style.color = "#ffc107";
        //document.querySelector('#' + CSS.escape(room)).style.backgroundColor = "white";

        // Clear message area
        //document.querySelector('#display-message-section').innerHTML = '';

        // Autofocus on text box
        // document.querySelector("#user_message").focus();
    }

    // Scroll chat window down
    function scrollDownChatWindow() {
        const chatWindow = document.querySelector("#display-message-section");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Print system messages
    function printSysMsg(msg) {
        const p = document.createElement('p');
        p.setAttribute("class", "system-msg");
        p.innerHTML = msg;
        document.querySelector('#display-message-section').append(p);
        scrollDownChatWindow()

        // Autofocus on text box
        document.querySelector("#user_message").focus();
    }




    function formatDate(date) {
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        return day + ' ' + monthNames[monthIndex] + ' ' + year + '   ' + hours + ":" + minutes;
    }











})