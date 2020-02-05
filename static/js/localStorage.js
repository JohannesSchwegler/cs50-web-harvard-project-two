document.addEventListener("DOMContentLoaded", () => {



    //Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port)
    console.log(localStorage)
    // Register button and store username 
    document.getElementById('register-user').onclick = () => {
        const user = document.getElementsByClassName('cc-username')[0].value;
        if (user === "") {
            document.getElementsByClassName('cc-error')[0].innerHTML = "Please enter a valid username"
        } else {
            window.open("/chat", "_self")
            localStorage.setItem("name", user)
            socket.emit('user connected', { 'user': user });
            document.getElementsByClassName('dropdown-toggle')[0].innerHTML = localStorage.name;

        }

    }

})