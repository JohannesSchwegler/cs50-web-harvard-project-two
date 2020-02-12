document.addEventListener("DOMContentLoaded", () => {

  var links= document.querySelectorAll('.nav-item a')
  links.forEach(item =>{

    item.addEventListener("click", (e) =>{
        console.log(!localStorage.getItem("user"));
        if (localStorage.getItem("user")){
              
            e.preventDefault();
            let error= document.querySelector('.cc-error');
            console.log(error);
            error.innerHTML="Please enter a username first";
        }
       

    })
  })


});