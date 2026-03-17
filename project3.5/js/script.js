let score = 0;

function increaseScore() {
    score++;
    $("#score").html(score + " pts");
}

// Slash effect
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

// Game variables
let running = false;
let enemies = [];
let arrows = [];
let beams = [];
let lives = 5;
let kills = 0;

let lastSpawn = 0;
let lastTime = 0;

let CX, CY, RADIUS, CASTLE;

// --------------------------------------
// PAGE LOAD
// --------------------------------------
window.addEventListener("load", () => {
    let name = prompt("What's your name Adventurer?");
    const directionsEl = document.getElementById("directions");

    if (directionsEl) {
        directionsEl.textContent =
            name
                ? `${name}, this is whack-a-mole with RPG elements. Hit enemies for EXP and skills!`
                : `This is whack-a-mole with RPG elements. Hit enemies for EXP and skills!`;
    }

    $("#gamespace").html(`
        <div id="circleGame" style="
            position:relative;
            width:600px;
            height:600px;
            border-radius:50%;
            background: linear-gradient(171deg, rgba(214,214,214,1) 0%, rgba(218,227,213,1) 50%, rgba(156,186,156,1) 100%);
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

    $("#start_button").css({
        width: "150px",
        height: "50px",
        fontSize: "18px",
        backgroundColor: "#4dd14d",
        color: "white",
        border: "none",
        borderRadius: "8px"
    });

    $("#start_button").on("click", function () {
        alert("Game Started!");
        $(this).off();
        setupGame();
    });
});

// --------------------------------------
// SETUP
// --------------------------------------
function setupGame() {
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
// HELPERS
// --------------------------------------
function norm(x, y) {
    const m = Math.hypot(x, y) || 1;
    return { x: x / m, y: y / m };
}

function aabbOverlap(a, b) {
    return !(
        a.x + a.w < b.x ||
        a.x > b.x + b.w ||
        a.y + a.h < b.y ||
        a.y > b.y + b.h
    );
}

function spawnPos(type) {
    let angle = Math.random() * Math.PI * 2;

    // ranged enemies spawn farther out
    let r = (type === "bow" || type === "wiz")
        ? RADIUS - 60
        : 170 + Math.random() * (RADIUS - 40 - 170);

    let x = CX + r * Math.cos(angle) - 14;
    let y = CY + r * Math.sin(angle) - 14;

    return { x, y };
}

// --------------------------------------
// PROJECTILES
// --------------------------------------
function shootArrow(enemy) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;

    const dir = norm(CX - cx, CY - cy);

    const $el = $("<div class='arrow'></div>").css({
        position: "absolute",
        width: "10px",
        height: "4px",
        background: "brown",
        left: cx,
        top: cy
    });

    $("#circleGame").append($el);

    arrows.push({
        $el,
        x: cx,
        y: cy,
        w: 10,
        h: 4,
        dx: dir.x * 200,
        dy: dir.y * 200
    });
}

function shootBeam(enemy) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;

    const dir = norm(CX - cx, CY - cy);

    const $el = $("<div class='beam'></div>").css({
        position: "absolute",
        width: "6px",
        height: "6px",
        background: "cyan",
        boxShadow: "0 0 10px cyan",
        left: cx,
        top: cy
    });

    $("#circleGame").append($el);

    beams.push({
        $el,
        x: cx,
        y: cy,
        w: 6,
        h: 6,
        dx: dir.x * 300,
        dy: dir.y * 300
    });
}

// --------------------------------------
// SPAWN ENEMY
// --------------------------------------
function spawnEnemy() {
    const types = ["sword", "bow", "wiz"];
    const type = types[Math.floor(Math.random() * 3)];

    const pos = spawnPos(type);

    const $el = $(`<div class="enemy ${type}"></div>`).css({
        position: "absolute",
        width: "28px",
        height: "28px",
        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        left: pos.x,
        top: pos.y
    });

    $("#circleGame").append($el);

    const enemy = {
        $el,
        type,
        x: pos.x,
        y: pos.y,
        w: 28,
        h: 28,
        lastShot: performance.now(),
        stationary: (type === "bow" || type === "wiz") // 🔒 LOCK
    };

    $el.on("click", (ev) => {
        enemy.$el.remove();
        enemies = enemies.filter(e => e !== enemy);
        kills++;
        increaseScore();
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

    if (lives <= 0) {
        running = false;
        alert("Game Over! Kills: " + kills);
        return;
    }

    if (now - lastSpawn > 900) {
        spawnEnemy();
        lastSpawn = now;
    }

    enemies.forEach(e => {
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        const dir = norm(CX - cx, CY - cy);

        // ⚔️ ONLY swords move
        if (!e.stationary) {
            e.x += dir.x * 60 * dt;
            e.y += dir.y * 60 * dt;

            e.$el.css({ left: e.x, top: e.y });

            if (aabbOverlap(e, CASTLE)) {
                e.$el.remove();
                enemies = enemies.filter(en => en !== e);
                lives--;
            }
        }

        // 🏹 Bow shoots only
        if (e.type === "bow") {
            if (now - e.lastShot > 4000) {
                e.lastShot = now;
                shootArrow(e);
            }
        }

        // ⚡ Wizard shoots only
        if (e.type === "wiz") {
            if (now - e.lastShot > 5000) {
                e.lastShot = now;
                shootBeam(e);
            }
        }
    });

    // ARROWS
    arrows.forEach(a => {
        a.x += a.dx * dt;
        a.y += a.dy * dt;
        a.$el.css({ left: a.x, top: a.y });

        if (aabbOverlap(a, CASTLE)) {
            a.$el.remove();
            arrows = arrows.filter(ar => ar !== a);
            lives--;
            return;
        }

        if (a.x < 0 || a.x > 600 || a.y < 0 || a.y > 600) {
            a.$el.remove();
            arrows = arrows.filter(ar => ar !== a);
        }
    });

    // BEAMS
    beams.forEach(b => {
        b.x += b.dx * dt;
        b.y += b.dy * dt;
        b.$el.css({ left: b.x, top: b.y });

        if (aabbOverlap(b, CASTLE)) {
            b.$el.remove();
            beams = beams.filter(be => be !== b);
            lives--;
            return;
        }

        if (b.x < 0 || b.x > 600 || b.y < 0 || b.y > 600) {
            b.$el.remove();
            beams = beams.filter(be => be !== b);
        }
    });

    requestAnimationFrame(loop);
}