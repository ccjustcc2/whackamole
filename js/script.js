let score = 0;

function increaseScore() {
    score++;
    $("#score").html(score + " pts");
}

function updateLivesUI() {
    $("#livesDisplay").text("Lives: " + lives);
}

function updateTimerUI() {
    $(".timer-display").text(timeLeft.toFixed(0) + " seconds left");
}

let running = false;
let enemies = [];
let arrows = [];
let beams = [];
let lives = 5;
let kills = 0;
let timeLeft = 30;
let lastSpawn = 0;
let lastTime = 0;

let CX, CY, RADIUS, CASTLE;

// Unified Game Over Function
function gameOver(message) {
    if (!running) return;
    running = false;

    const $gameOver = $(`
        <div id="gameOverScreen" style="
            position:absolute;
            top:0;
            left:0;
            width:100%;
            height:100%;
            background:rgba(0,0,0,0.7);
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            color:white;
            font-size:24px;
            z-index:10;
        ">
            <div>${message}</div>
            <button id="playAgainBtn" style="
                margin-top:20px;
                padding:10px 20px;
                font-size:18px;
                background:#4dd14d;
                border:none;
                border-radius:8px;
                cursor:pointer;
            ">
                Play Again
            </button>
        </div>
    `);

    $("#circleGame").append($gameOver);

    $("#playAgainBtn").on("click", function () {
        $("#gameOverScreen").remove();
        $("#circleGame").empty().append(`
            <div id="castle" style="
                position:absolute;
                width:100px;
                height:100px;
                left:50%; 
                top:50%;
                transform:translate(-50%, -50%);
                background-image: url('./img/castle.webp');
                background-size: cover;
            "></div>
        `);

        setupGame();
    });
}

window.addEventListener("load", () => {
    let name = prompt("What's your name Adventurer?");
    const directionsEl = document.getElementById("directions");

    if (directionsEl) {
        directionsEl.textContent =
            name
                ? `${name}, this is whack-a-mole with RPG elements. Hit enemies for EXP and skills!`
                : `This is whack-a-mole with RPG elements. Hit enemies for EXP and skills!`;
    }

    if (!$("#livesDisplay").length) {
        $("#leftside").append(`<div id="livesDisplay">Lives: 5</div>`);
    }

    updateLivesUI();

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
            width:100px;
            height:100px;
            left:50%; 
            top:50%;
            transform:translate(-50%, -50%);
            background-image: url('./img/castle.webp');
            background-size: cover;
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

function setupGame() {
    const $arena = $("#circleGame");
    timeLeft = 30;
    updateTimerUI();

    const W = $arena.width();
    const H = $arena.height();

    CX = W / 2;
    CY = H / 2;
    RADIUS = W / 2;

    CASTLE = {
        x: CX - 50,
        y: CY - 50,
        w: 100,
        h: 100
    };

    lives = 5;
    kills = 0;
    enemies = [];
    arrows = [];
    beams = [];

    updateLivesUI();

    running = true;
    lastSpawn = performance.now();
    lastTime = performance.now();

    requestAnimationFrame(loop);
}

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

    let r = (type === "bow" || type === "wiz")
        ? RADIUS - 60
        : 170 + Math.random() * (RADIUS - 40 - 170);

    let x = CX + r * Math.cos(angle) - 14;
    let y = CY + r * Math.sin(angle) - 14;

    return { x, y };
}

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
    const perp = { x: -dir.y, y: dir.x };

    beams.push({
        origin: { x: cx, y: cy },
        dir,
        perp,
        segs: [],
        headDist: 0,
        totalDist: 0,
        dead: false
    });
}

function spawnEnemy() {
    const types = ["sword", "bow", "wiz"];
    const type = types[Math.floor(Math.random() * 3)];

    const pos = spawnPos(type);

    const enemyImages = {
        sword: "./img/sword.jpg",
        bow: "./img/archer.jpg",
        wiz: "./img/wizard.png"
    };

    const $el = $(`<div class="enemy ${type}"></div>`).css({
        position: "absolute",
        width: "48px",
        height: "48px",
        backgroundImage: `url(${enemyImages[type]})`,
        backgroundSize: "cover",
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
        stationary: (type === "bow" || type === "wiz")
    };

    $el.on("click", (ev) => {
        enemy.$el.remove();
        enemies = enemies.filter(e => e !== enemy);
        kills++;
        increaseScore();

        timeLeft += 1;
        updateTimerUI();

        ev.stopPropagation();
    });

    enemies.push(enemy);
}

function loop(now) {
    if (!running) return;

    let dt = Math.min(50, now - lastTime) / 1000;
    lastTime = now;

    // TIMER LOSS
    timeLeft -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerUI();
        gameOver(`Time ran out! Kills: ${kills}`);
        return;
    }

    updateTimerUI();

    // ENEMY SPAWN
    if (now - lastSpawn > 900) {
        spawnEnemy();
        lastSpawn = now;
    }

    enemies.forEach(e => {
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        const dir = norm(CX - cx, CY - cy);

        if (!e.stationary) {
            e.x += dir.x * 60 * dt;
            e.y += dir.y * 60 * dt;
            e.$el.css({ left: e.x, top: e.y });

            if (aabbOverlap(e, CASTLE)) {
                e.$el.remove();
                enemies = enemies.filter(en => en !== e);
                lives--;
                updateLivesUI();

                if (lives <= 0) {
                    gameOver(`Game Over! You lost all your lives. Kills: ${kills}`);
                    return;
                }
            }
        }

        if (e.type === "bow" && now - e.lastShot > 4000) {
            e.lastShot = now;
            shootArrow(e);
        }

        if (e.type === "wiz" && now - e.lastShot > 2000) {
            e.lastShot = now;
            shootBeam(e);
        }
    });

    arrows = arrows.filter(a => {
        a.x += a.dx * dt;
        a.y += a.dy * dt;
        a.$el.css({ left: a.x, top: a.y });

        if (aabbOverlap(a, CASTLE)) {
            a.$el.remove();
            lives--;
            updateLivesUI();

            if (lives <= 0) {
                gameOver(`Game Over! You lost all your lives. Kills: ${kills}`);
            }

            return false;
        }

        if (a.x < 0 || a.x > 600 || a.y < 0 || a.y > 600) {
            a.$el.remove();
            return false;
        }

        return true;
    });

    beams = beams.filter(b => {
        const SPEED = 200;
        const SEG_LEN = 12;
        const ZIG_STEP = 20;
        const ZIG_AMPLITUDE = 16;

        if (b.dead) {
            b.segs.forEach(seg => seg.$el.remove());
            return false;
        }

        b.headDist += SPEED * dt;

        while (b.totalDist < b.headDist) {
            b.totalDist += SEG_LEN;

            const t = b.totalDist;
            const zigIndex = Math.floor(t / ZIG_STEP);
            const offset = (zigIndex % 2 === 0 ? 1 : -1) * ZIG_AMPLITUDE;

            const x = b.origin.x + b.dir.x * t + b.perp.x * offset;
            const y = b.origin.y + b.dir.y * t + b.perp.y * offset;

            const $seg = $("<div class='beam'></div>").css({
                position: "absolute",
                width: "6px",
                height: "6px",
                background: "cyan",
                boxShadow: "0 0 10px cyan",
                left: x,
                top: y
            });

            $("#circleGame").append($seg);

            const segObj = { $el: $seg, x, y, w: 6, h: 6 };
            b.segs.push(segObj);

            if (aabbOverlap(segObj, CASTLE)) {
                lives--;
                updateLivesUI();

                if (lives <= 0) {
                    gameOver(`Game Over! You lost all your lives. Kills: ${kills}`);
                }

                b.dead = true;
                break;
            }
        }

        b.segs = b.segs.filter(seg => {
            if (seg.x < 0 || seg.x > 600 || seg.y < 0 || seg.y > 600) {
                seg.$el.remove();
                return false;
            }
            return true;
        });

        return true;
    });

    requestAnimationFrame(loop);
}
