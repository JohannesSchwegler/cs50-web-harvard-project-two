document.addEventListener('DOMContentLoaded', () => {
	//Start Socket IO
	var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

	var chat_socket = io(location.protocol + '//' + document.domain + ':' + location.port + "/chat");
	var private_socket = io(location.protocol + '//' + document.domain + ':' + location.port + "/private")

	document.getElementById("message_input").value = "";

	socket.on("username_check", data => {
		// Get Username from Local Storage
		const username = localStorage.getItem("username");

		if (!username) {

			document.getElementById("username_input").value = "";
			document.getElementById("chat_div").classList.remove("d-flex");
			document.getElementById("chat_div").classList.add("d-none");
			document.querySelector("#user_submit").onclick = () => {
				const errorCheck = document.getElementById("user_input_error");
				if (errorCheck != null){
						errorCheck.parentNode.removeChild(errorCheck);
				}

				let username = document.querySelector("#username_input").value;
				socket.emit("create user", {"username": username});
			};

		} else { // Username is in local storage
			document.getElementById("intro").style.display = "none";
			document.getElementById("user_welcome").innerHTML = `Welcome, ${username}!`;
			socket.emit("sid", {"username": username});
			var currentChannel = localStorage.getItem("currentChannel");
			if (currentChannel != null) {
				joinChannel(currentChannel);
			};
		};
	});
	// User Input Error
	socket.on("user input error", data => {
		const error = document.createElement("p");
		error.id = "user_input_error";
		error.innerHTML = `${data.error}`;
		const inputField = document.getElementById("username_input_group");
		document.getElementById("intro").insertBefore(error, inputField);
	});

	socket.on("user success", data => {
		localStorage.setItem("username", data.username);
		location.reload();
	});

	// Loading Channels
	socket.on('load channels', data => {
		// Public Channels
		const ul = document.getElementById("channel_list");
		// console.log(`channels length: ${data.channels.length}`);

		for (var i = 0; i < data.channels.length; i++) {
			let li = document.createElement("li");
			li.innerHTML = `<a href="#" class="a_channel" id="${data.channels[i]}">#${data.channels[i]}</a>`;
			ul.appendChild(li);
			let anchor = document.getElementById(`${data.channels[i]}`);
			let id = data.channels[i];

		 	anchor.addEventListener("click", function() {
				joinChannel(`${id}`);
			});

		};

		// Private Channels
		socket.emit("get private channels", {"username": localStorage.getItem("username")});

	});

	// Loading Private Channels
	socket.on("load private", data => {
		const pri_ul = document.getElementById("private_message_list");
		const username = data.username;

		for (var i = 0; i < data.channels.length; i++){
			let li = document.createElement("li");
			var recipient = data.channels[i].replace("@", "").replace(data.username, "").replace("/", "");

			li.innerHTML = `<a href="#" class="p_channel" id="${data.channels[i]}">${recipient}</a>`;
			pri_ul.appendChild(li);

			let anchor = document.getElementById(`${data.channels[i]}`);

			let id = data.channels[i];

			anchor.addEventListener("click", function() {
				joinChannel(`${id}`);
			});
		};

	});

	// Create Channel - Success
	socket.on("channel success", data => {
		const li = document.createElement("li");
		li.innerHTML = `<a href='#' class="a_channel" id="${data.channelName}">#${data.channelName}</a>`;
		document.getElementById("channel_list").appendChild(li);
		const anchor = document.getElementById(data.channelName);
		anchor.addEventListener("click", () => {
			joinChannel(data.channelName);
		});

	});

	// Create Channel - Channel Input Error
	socket.on("channel error", data => {
		if (document.getElementById("channel_name_error") != null){
			document.getElementById("channel_name_error").parentNode.removeChild(document.getElementById("channel_name_error"));
		};

		const error = document.createElement("p");
		error.id = "channel_name_error";
		error.innerHTML = `${data.error}`;
		const inputField = document.getElementById("create_channel_div");
		document.getElementById("create_channel_wrapper").insertBefore(error, inputField);
	});

	// Clear Local Storage
	// document.getElementById("clear").onclick = () => {
	// 	localStorage.clear();
	// 	location.reload();
	// }



	// Submit New Channel Name
	document.getElementById("channel_submit").onclick = () => {
		const errorCheck = document.getElementById("channel_name_error");
		if (errorCheck != null){
				errorCheck.parentNode.removeChild(errorCheck);
		}

		let channelName = document.getElementById("create_channel").value;
		socket.emit("create channel", {"channelName": channelName, "username": localStorage.getItem("username")});
		document.getElementById("create_channel").value = "";
	};

	// Join Channel
	socket.on("join channel", data => {
		document.getElementById("chat_msg_header").innerHTML = `Now Talking In: #${data.channel}`;
		document.getElementById("chat_msg_header").style.borderBottom = "1px solid #2b2b2b";
		localStorage.setItem("currentChannel", `${data.channel}`);
		const chat_window = document.getElementById("messages");
		chat_window.innerHTML = "";
		for (var i = 0; i < data.messages.length; i++) {
			let messageDiv = document.createElement("div");
			if (data.messages[i][0] == localStorage.getItem("username")) {
				messageDiv.classList.add("user_msg", "d-flex", "flex-column", "align-items-end");
			} else {
				messageDiv.classList.add("received_msg", "d-flex", "flex-column", "align-items-start");
			};
			var messageLine = document.createElement("p");
			messageLine.innerHTML = `<span class="msg_user">${data.messages[i][0]}</span>	<span class="msg_time">${data.messages[i][2]}</span><br>${data.messages[i][1]}`;
			messageDiv.appendChild(messageLine);
			chat_window.appendChild(messageDiv);
			var msg_wrapper = document.getElementById("messages");
			msg_wrapper.scrollTop = msg_wrapper.scrollHeight;
		};

	});

	// Submit Channel Message
	document.getElementById("message_submit").onclick = () => {

		let message = document.getElementById("message_input").value;
		document.getElementById("message_input").value = "";

		if (message.length === 0){
			return;
		};

		// If Not Sending to User from Room
		if (message.charAt(0) !== "@") {
			socket.emit("submit message", {"username": localStorage.getItem("username"), "message": message,
															"room": localStorage.getItem("currentChannel"), "time": getTime()});
		} else { //If Sending message to user
			// Extract Username after @
			var recipient = message.substring(1, message.indexOf(" "));
			if (recipient == localStorage.getItem("username")) {
				const private_send_error = document.createElement("p");
				private_send_error.classList.add("error");
				private_send_error.innerHTML = "You cannot send a message to yourself!";
				document.getElementById("messages").appendChild(private_send_error);
				return;
			};

			// Remove from Message
			message = message.slice(recipient.length + 2);
			// Set up Private Room
			socket.emit("private message", {"username": localStorage.getItem("username"), "recipient": recipient,
									"message": message, "time": getTime()});
		};

	};
	// Get Time Function
	function getTime(){
		var today = new Date();
		var date = ("0" + today.getDate()).slice(-2) + "/" + ("0" + (today.getMonth()+1)).slice(-2) + "/" + today.getFullYear();
		var time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" + ("0" + today.getSeconds()).slice(-2);
		return date + " " + time;
	};
	// Message Success - Push to other users
	socket.on("message success", data => {
		if (data.room === localStorage.getItem("currentChannel")) {
			let messageDiv = document.createElement("div");
			if (data.message_username == localStorage.getItem("username")) {
				messageDiv.classList.add("user_msg", "d-flex", "flex-column", "align-items-end");
			} else {
				messageDiv.classList.add("received_msg", "d-flex", "flex-column", "align-items-start");
			};
			const channel_message_line = document.createElement("p");
			channel_message_line.innerHTML = `<span class="msg_user">${data.message_username}</span>	<span class="msg_time">${data.message_time}</span><br>${data.message_content}`;
			messageDiv.appendChild(channel_message_line);
			document.getElementById("messages").appendChild(messageDiv);
			var msg_wrapper = document.getElementById("messages");
			msg_wrapper.scrollTop = msg_wrapper.scrollHeight;
		};


	});

	// Enter Channel Room - OnClick
	function joinChannel(id){
		localStorage.setItem("current_channel", id);
		socket.emit("join", {"username": localStorage.getItem("username"), "room": id});
	};

	// New Private Message Channel
	socket.on("private_message", data => {

		const li = document.createElement("li");
		let recipient = data.room.replace("@", "").replace(localStorage.getItem("username"), "").replace("/", "");

		li.innerHTML = `<a href='#' class="p_channel" id="${data.room}">${recipient}</a>`;
		document.getElementById("private_message_list").appendChild(li);
		const anchor = document.getElementById(data.room);
		anchor.addEventListener("click", () => {
			joinChannel(data.room);
		});

	});


	//Hide/Show Channel Select on smaller screens
	const dismiss = document.getElementById("dismiss");
	const appear = document.getElementById("sidebarCollapse");
	const sidebar = document.getElementById("chatlist");
	console.log(appear.classList);

	if (window.innerWidth <= 768){
		sidebar.style.width = "0";
		appear.classList.add("d-block");

		dismiss.addEventListener("click", () => {
			sidebar.style.width = "0";
			sidebar.style.borderRight = "none";
			appear.classList.add("d-block");
			appear.classList.remove("d-none");
		});

		appear.addEventListener("click", () => {
			sidebar.style.width = "250px";
			sidebar.style.borderRight = "1px solid #2b2b2b";
			appear.classList.add("d-none");
			appear.classList.remove("d-block");
		});
	};

	window.onresize = function(){
		console.log(window.innerWidth);
		if (window.innerWidth <= 768){
				sidebar.style.width = "0";
				sidebar.style.borderRight = "none";
				appear.classList.add("d-block");

				dismiss.addEventListener("click", () => {
					sidebar.style.width = "0";
					sidebar.style.borderRight = "none";
					appear.classList.add("d-block");
					appear.classList.remove("d-none");
				});

				appear.addEventListener("click", () => {
					sidebar.style.width = "250px";
					sidebar.style.borderRight = "1px solid #2b2b2b";
					appear.classList.add("d-none");
					appear.classList.remove("d-block");
				});

		} else {
			sidebar.style.width = "350px";
			sidebar.style.borderRight = "1px solid #2b2b2b";
		};

	}



});
