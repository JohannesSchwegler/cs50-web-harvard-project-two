document.addEventListener("DOMContentLoaded", () => {
  //Connect to websocket
  var socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );
  
  // Register button and store username
  document.getElementById("register-user").onclick = () => {
    const username = document.getElementsByClassName("cc-username")[0].value;
    if (username === "") {
      document.getElementsByClassName("cc-error")[0].innerHTML =
        "Please enter a valid username";
    } else {
      window.open("/chat", "_self");
      localStorage.setItem("username", username);
      socket.emit("user connected", { username: username });
      document.querySelector("dropdown-toggle").innerHTML = "test";
    }
  };
});
