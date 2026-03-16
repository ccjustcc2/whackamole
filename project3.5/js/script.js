
let score = 0;

function increaseScore() {
    score++;
    $("#score").html(score + " pts");
}

function randomX() {
    let width = $("#gamespace").width();
    return Math.floor(Math.random() * width);
}




function randomY() {
    let height = $("#gamespace").height();
    return Math.floor(Math.random() * height);
}

// Slash effect kept
$(document).on("click", function(e) {
    const $slash = $("<div class='slash'></div>");
    $slash.css({
        left: e.pageX - 75 + "px",
        top: e.pageY - 75 + "px",
        backgroundImage: "url('../img/slash.gif')"
    });
    $("body").append($slash);
    setTimeout(() => $slash.remove(), 300);
});

// Personalized directions
window.addEventListener("load", () => {
    let name = prompt("What's your name Adventurer?");
    const directionsEl = document.getElementById("directions");
    if (!directionsEl) return;

    directionsEl.textContent =
        name
            ? `${name}, this is whack-a-mole with RPG elements. Hit enemies for EXP and skills!`
            : `This is whack-a-mole with RPG elements. Hit enemies for EXP and skills!`;
});
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

let running = false;
let enemies = [];
let arrows = [];
let beams = [];
let lives = 5;
let kills = 0;

let lastSpawn = performance.now();
let lastTime = performance.now();

let CX, CY, RADIUS, CASTLE;

// Start game when clicking Game A start button
$("#start_button").on("click", function () {
    $("#start_button").off(); 

    $("#gamespace").html(`
        <div id="circleGame" style="
            position:relative;
            width:600px;
            height:600px;
            border-radius:50%;
            background: linear-gradient(171deg, rgba(214, 214, 214, 1) 0%, rgba(218, 227, 213, 1) 50%, rgba(156, 186, 156, 1) 100%);
            cursor: url(../img/shank.png),auto;
            margin:0 auto;
            overflow:hidden;
        ">
            <div id="castle" style="
                position:absolute;
                width:40px;
                height:40px;
                background:#d62828;
                left:50%; 
                top:50%;
                transform:translate(-50%, -50%);
            "></div>
        </div>
    `);

    setupGameB();
});


function setupGameB() {
    const $arena = $("#circleGame");

    const W = $arena.width();
    const H = $arena.height();

    CX = W / 2;
    CY = H / 2;
    RADIUS = W / 2;

    CASTLE = {
        x: CX - 20,
        y: CY - 20,
        w: 40,
        h: 40
    };

    lives = 5;
    kills = 0;
    enemies = [];
    arrows = [];
    beams = [];

    running = true;
    lastSpawn = performance.now();
    lastTime = performance.now();

    requestAnimationFrame(loop);
}

// --------------------------------------
// HELPER FUNCTIONS
// --------------------------------------
function norm(x, y) {
    const m = Math.hypot(x, y) || 1;
    return { x: x / m, y: y / m };
}

function insideCircle(x, y) {
    const dx = x - CX, dy = y - CY;
    return dx * dx + dy * dy <= (RADIUS - 2) * (RADIUS - 2);
}

function aabbOverlap(a, b) {
    return !(
        a.x + a.w < b.x ||
        a.x > b.x + b.w ||
        a.y + a.h < b.y ||
        a.y > b.y + b.h
    );
}

function spawnPos() {
    // choose angle and distance from center
    let angle = Math.random() * Math.PI * 2;
    let r = 170 + Math.random() * (RADIUS - 40 - 170);

    let x = CX + r * Math.cos(angle) - 14;  // center enemy
    let y = CY + r * Math.sin(angle) - 14;

    return { x, y };
}

// --------------------------------------
// SPAWN ENEMY
// --------------------------------------
function spawnEnemy() {
    const types = ["sword", "bow", "wiz"];
    const type = types[Math.floor(Math.random() * 3)];

    const pos = spawnPos();

    const $el = $(`<div class="enemy ${type}"></div>`).css({
        position: "absolute",
        width: "28px",
        height: "28px",
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        left: pos.x + "px",
        top: pos.y + "px",
    });

    $("#circleGame").append($el);

    const enemy = {
        $el,
        type,
        x: pos.x,
        y: pos.y,
        w: 28,
        h: 28,
        lastShot: performance.now()
    };

    // CLICK = KILL + INCREASE SCORE
    $el.on("click", (ev) => {
        enemy.$el.remove();
        enemies = enemies.filter(e => e !== enemy);
        kills++;
        increaseScore();       // <-- connect to Game A scoring
        ev.stopPropagation();
    });

    enemies.push(enemy);
}

// --------------------------------------
// MAIN LOOP
// --------------------------------------
function loop(now) {
    if (!running) return;

    let dt = Math.min(50, now - lastTime) / 1000;
    lastTime = now;

    // Spawn rate
    if (now - lastSpawn > 900) {
        spawnEnemy();
        lastSpawn = now;
    }

    // Enemy movement/attacks
    enemies.forEach(e => {
        const centerX = e.x + e.w / 2;
        const centerY = e.y + e.h / 2;

        const direction = norm(CX - centerX, CY - centerY);

        if (e.type === "sword") {
            e.x += direction.x * 60 * dt;
            e.y += direction.y * 60 * dt;
            e.$el.css({ left: e.x, top: e.y });

            if (aabbOverlap(e, CASTLE)) {
                e.$el.remove();
                enemies = enemies.filter(en => en !== e);
                lives--;
            }
        }
    });

    requestAnimationFrame(loop);
}