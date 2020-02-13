document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".dropdown-toggle").innerHTML = localStorage.username;

  let slug = window.location.pathname.replace("/", "");


  if (slug === "about" || slug === "chat") {
    if (!localStorage.getItem("username")) {
      window.open("/", "_self");
    }
  }

  var links = document.querySelectorAll(".nav-item a");

  links.forEach(item => {
    item.addEventListener("click", e => {
      if (!localStorage.getItem("username")) {
        console.log("auf");
        e.preventDefault();
        let error = document.querySelector(".cc-error");
        error.innerHTML = "Please enter a username first";
      }
    });
  });
});
