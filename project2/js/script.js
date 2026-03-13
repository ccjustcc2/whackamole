



src="jquery-3.3.1.min.js"

let score = 0;

function increaseScore(){
    score++;
    $("#score").html(score + " pts");
}

function randomX(){
    let width = $("#gamespace").width();
    return Math.floor(Math.random() * width);
}

function randomY(){
    let height = $("#gamespace").height();
    return Math.floor(Math.random() * height);
}

$(document).ready(function(){

    $(".timer-display").show();

    alert(randomX());
    alert(randomY());

    $("#start_button").click(function(){
        alert("Game Started!");

        $("#gamespace").append('<img id ="mainClick" src="./img/goblin.jpg" alt="gobslin"></img>');
        $("#start_button").off();
    });

    $("#start_button").css({
        "width": "150px",
        "height": "50px",
        "font-size": "18px",
        "background-color": "#4dd14d",
        "color": "white",
        "border": "none",
        "border-radius": "8px"
    });

    $("#mainClick").css({
        "width":"px"
    })


    increaseScore();

});


$(document).on("click", function(e) {
    // Create the slash element using your GIF
    const $slash = $("<div class='slash'></div>");

    $slash.css({
        left: e.pageX - 75 + "px",  // center horizontally
        top: e.pageY - 75 + "px",   // center vertically
        backgroundImage: "url('../img/slash.gif')"
    });

    $("body").append($slash);

    // Remove it after the GIF finishes
    setTimeout(() => {
        $slash.remove();
    }, 300); // match your GIF's duration in ms
});



window.addEventListener('load', (event) =>{


    let name = prompt("whats your name Adventurer");
    let score = 0 


  const directionsEl = document.getElementById("directions");
  if (!directionsEl) return; 

  if (name) {
    directionsEl.textContent = name + ", this is whack-a-mole with RPG elements. There is a skill tree with different features. You hit goblins for EXP, and with EXP you'll get more skills to use. At the end of the level there will be a boss.";
  } else {
    directionsEl.textContent = "this is whack-a-mole with RPG elements. There is a skill tree with different features. You hit goblins for EXP, and with EXP you'll get more skills to use. At the end of the level there will be a boss.";
  }
});
