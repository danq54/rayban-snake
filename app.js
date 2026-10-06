// ==================================================
// SCREEN NAVIGATION
// ==================================================

const homeScreen = document.getElementById("home-screen");
const instructionsScreen = document.getElementById("instructions-screen");
const gameScreen = document.getElementById("game-screen");

function getCurrentScreen() {
    const params = new URLSearchParams(window.location.search);
    return params.get("screen") || "home";
}

function showScreen(screen) {

    homeScreen.hidden = screen !== "home";
    instructionsScreen.hidden = screen !== "instructions";
    gameScreen.hidden = screen !== "game";

    // Give sensible initial focus to each screen
    if (screen === "home") {
        document.getElementById("play-button").focus();
    }

    if (screen === "instructions") {
        document.getElementById("instructions-back-button").focus();
    }

    if (screen === "game") {
        resetGame();
        focusControl("enter");
    }
}

function navigateTo(screen) {

    const url =
        screen === "home"
            ? window.location.pathname
            : `${window.location.pathname}?screen=${screen}`;

    history.pushState(
        { screen: screen },
        "",
        url
    );

    showScreen(screen);
}

// Handle links as real navigation screens
document.addEventListener("click", event => {

    const link = event.target.closest("a[href]");

    if (!link) {
        return;
    }

    const url = new URL(link.href);

    if (url.origin !== window.location.origin) {
        return;
    }

    event.preventDefault();

    const params = new URLSearchParams(url.search);

    const screen =
        params.get("screen") || "home";

    navigateTo(screen);
});

// Browser Back / Forward
window.addEventListener("popstate", () => {
    showScreen(getCurrentScreen());
});

history.replaceState(
    { screen: getCurrentScreen() },
    "",
    window.location.href
);


// ==================================================
// GAME SETUP
// ==================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRID_SIZE = 30;
const CELL_SIZE = canvas.width / GRID_SIZE;

const INITIAL_SPEED = 140;
const MIN_SPEED = 55;
const SPEED_INCREASE = 4;

const FRAME_INTERVAL = 1000 / 30;


// ==================================================
// CONTROLS
// ==================================================

const controls = {
    up: document.getElementById("button-up"),
    down: document.getElementById("button-down"),
    left: document.getElementById("button-left"),
    right: document.getElementById("button-right"),
    enter: document.getElementById("button-enter")
};


// ==================================================
// GAME STATE
// ==================================================

let snake;
let food;

let direction;
let nextDirection;

let score;
let speed;

let gameState = "ready";

let lastMoveTime = 0;
let lastRenderTime = 0;

let animationFrame = null;


// ==================================================
// RESET GAME
// ==================================================

function resetGame() {

    snake = [
        { x: 15, y: 15 },
        { x: 14, y: 15 },
        { x: 13, y: 15 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    score = 0;
    speed = INITIAL_SPEED;

    placeFood();

    gameState = "ready";

    lastMoveTime = 0;
    lastRenderTime = 0;

    draw();
}


// ==================================================
// START GAME
// ==================================================

function startGame() {

    if (gameState === "gameover") {
        resetGame();
    }

    gameState = "playing";

    lastMoveTime = performance.now();
    lastRenderTime = performance.now();

    if (animationFrame === null) {
        animationFrame =
            requestAnimationFrame(gameLoop);
    }

    draw();
}


// ==================================================
// PAUSE
// ==================================================

function togglePause() {

    if (gameState === "playing") {

        gameState = "paused";

        draw();

        return;
    }

    if (gameState === "paused") {

        gameState = "playing";

        lastMoveTime = performance.now();
        lastRenderTime = performance.now();

        draw();
    }
}


// ==================================================
// GAME LOOP
// ==================================================

function gameLoop(timestamp) {

    animationFrame =
        requestAnimationFrame(gameLoop);

    if (
        getCurrentScreen() !== "game" ||
        gameState !== "playing"
    ) {
        return;
    }

    // Snake movement
    if (timestamp - lastMoveTime >= speed) {

        update();

        lastMoveTime = timestamp;
    }

    // Maximum 30 FPS rendering
    if (
        timestamp - lastRenderTime >=
        FRAME_INTERVAL
    ) {

        draw();

        lastRenderTime = timestamp;
    }
}


// ==================================================
// UPDATE
// ==================================================

function update() {

    direction = nextDirection;

    const head = snake[0];

    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    };

    if (hitsWall(newHead)) {
        gameOver();
        return;
    }

    if (hitsSnake(newHead)) {
        gameOver();
        return;
    }

    snake.unshift(newHead);

    // Food eaten
    if (
        newHead.x === food.x &&
        newHead.y === food.y
    ) {

        score++;

        increaseSpeed();

        placeFood();

    } else {

        snake.pop();
    }
}


// ==================================================
// COLLISION
// ==================================================

function hitsWall(position) {

    return (
        position.x < 0 ||
        position.x >= GRID_SIZE ||
        position.y < 0 ||
        position.y >= GRID_SIZE
    );
}

function hitsSnake(position) {

    return snake.some(segment =>
        segment.x === position.x &&
        segment.y === position.y
    );
}


// ==================================================
// FOOD
// ==================================================

function placeFood() {

    let newFood;

    do {

        newFood = {
            x: Math.floor(
                Math.random() * GRID_SIZE
            ),

            y: Math.floor(
                Math.random() * GRID_SIZE
            )
        };

    } while (hitsSnake(newFood));

    food = newFood;
}


// ==================================================
// SPEED
// ==================================================

function increaseSpeed() {

    speed = Math.max(
        MIN_SPEED,
        INITIAL_SPEED -
        score * SPEED_INCREASE
    );
}


// ==================================================
// GAME OVER
// ==================================================

function gameOver() {

    gameState = "gameover";

    focusControl("enter");

    draw();
}


// ==================================================
// DIRECTION
// ==================================================

function changeDirection(x, y, controlName) {

    // Prevent immediate reversal
    if (
        x === -direction.x &&
        y === -direction.y
    ) {
        return;
    }

    nextDirection = { x, y };

    focusControl(controlName);

    if (gameState === "ready") {
        startGame();
    }
}


// ==================================================
// ENTER DURING GAME
// ==================================================

function handleGameEnter() {

    if (gameState === "ready") {

        startGame();

        return;
    }

    if (gameState === "playing") {

        togglePause();

        return;
    }

    if (gameState === "paused") {

        togglePause();

        return;
    }

    if (gameState === "gameover") {

        resetGame();

        startGame();
    }
}


// ==================================================
// MENU NAVIGATION
// ==================================================

function moveMenuFocus(direction) {

    const screen = getCurrentScreen();

    let elements = [];

    if (screen === "home") {

        elements = [
            document.getElementById("play-button"),
            document.getElementById("instructions-button")
        ];
    }

    if (screen === "instructions") {

        elements = [
            document.getElementById(
                "instructions-back-button"
            )
        ];
    }

    if (elements.length === 0) {
        return;
    }

    let index =
        elements.indexOf(document.activeElement);

    if (index === -1) {
        index = 0;
    }

    if (
        direction === "down" ||
        direction === "right"
    ) {

        index =
            (index + 1) % elements.length;
    }

    if (
        direction === "up" ||
        direction === "left"
    ) {

        index =
            (index - 1 + elements.length) %
            elements.length;
    }

    elements[index].focus();
}


// ==================================================
// GLOBAL D-PAD / KEYBOARD
// ==================================================

document.addEventListener("keydown", event => {

    const screen = getCurrentScreen();

    // ----------------------------------------------
    // GAME
    // ----------------------------------------------

    if (screen === "game") {

        switch (event.key) {

            case "ArrowUp":

                event.preventDefault();

                changeDirection(
                    0,
                    -1,
                    "up"
                );

                break;


            case "ArrowDown":

                event.preventDefault();

                changeDirection(
                    0,
                    1,
                    "down"
                );

                break;


            case "ArrowLeft":

                event.preventDefault();

                changeDirection(
                    -1,
                    0,
                    "left"
                );

                break;


            case "ArrowRight":

                event.preventDefault();

                changeDirection(
                    1,
                    0,
                    "right"
                );

                break;


            case "Enter":

                event.preventDefault();

                handleGameEnter();

                break;
        }

        return;
    }


    // ----------------------------------------------
    // MENUS
    // ----------------------------------------------

    switch (event.key) {

        case "ArrowUp":

            event.preventDefault();

            moveMenuFocus("up");

            break;


        case "ArrowDown":

            event.preventDefault();

            moveMenuFocus("down");

            break;


        case "ArrowLeft":

            event.preventDefault();

            moveMenuFocus("left");

            break;


        case "ArrowRight":

            event.preventDefault();

            moveMenuFocus("right");

            break;


        case "Enter":

            /*
             * IMPORTANT:
             *
             * Do NOT preventDefault here.
             *
             * The focused <a> should perform its
             * normal activation.
             */

            break;
    }
});


// ==================================================
// BUTTON INPUT
// ==================================================

controls.up.addEventListener(
    "click",
    () =>
        changeDirection(
            0,
            -1,
            "up"
        )
);

controls.down.addEventListener(
    "click",
    () =>
        changeDirection(
            0,
            1,
            "down"
        )
);

controls.left.addEventListener(
    "click",
    () =>
        changeDirection(
            -1,
            0,
            "left"
        )
);

controls.right.addEventListener(
    "click",
    () =>
        changeDirection(
            1,
            0,
            "right"
        )
);

controls.enter.addEventListener(
    "click",
    handleGameEnter
);


// ==================================================
// FOCUS
// ==================================================

function focusControl(name) {

    const button = controls[name];

    if (button) {
        button.focus();
    }
}


// ==================================================
// DRAW
// ==================================================

function draw() {

    clearScreen();

    drawFood();
    drawSnake();
    drawScore();

    if (gameState === "ready") {

        drawOverlay(
            "SNAKE",
            "Press ENTER"
        );
    }

    if (gameState === "paused") {

        drawOverlay(
            "PAUSED",
            "Press ENTER"
        );
    }

    if (gameState === "gameover") {

        drawOverlay(
            "GAME OVER",
            `Score ${score} - ENTER`
        );
    }
}


// ==================================================
// CLEAR
// ==================================================

function clearScreen() {

    ctx.fillStyle = "black";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// ==================================================
// DRAW SNAKE
// ==================================================

function drawSnake() {

    snake.forEach((segment, index) => {

        const x =
            segment.x * CELL_SIZE;

        const y =
            segment.y * CELL_SIZE;

        if (index === 0) {

            // Head
            ctx.fillStyle = "#FFFFFF";

            ctx.fillRect(
                x + 1,
                y + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2
            );

        } else {

            // Body
            ctx.fillStyle = "#E4E6EB";

            ctx.fillRect(
                x + 2,
                y + 2,
                CELL_SIZE - 4,
                CELL_SIZE - 4
            );
        }
    });
}


// ==================================================
// DRAW FOOD
// ==================================================

function drawFood() {

    const x =
        food.x * CELL_SIZE;

    const y =
        food.y * CELL_SIZE;

    ctx.fillStyle = "#FFFFFF";

    ctx.fillRect(
        x + 5,
        y + 5,
        CELL_SIZE - 10,
        CELL_SIZE - 10
    );
}


// ==================================================
// SCORE
// ==================================================

function drawScore() {

    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        "bold 20px monospace";

    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.fillText(
        `SCORE: ${score}`,
        15,
        12
    );
}


// ==================================================
// OVERLAY
// ==================================================

function drawOverlay(title, subtitle) {

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.80)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#FFFFFF";

    ctx.font =
        "bold 42px monospace";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        title,
        canvas.width / 2,
        canvas.height / 2 - 30
    );

    ctx.font =
        "bold 18px monospace";

    ctx.fillText(
        subtitle,
        canvas.width / 2,
        canvas.height / 2 + 25
    );
}


// ==================================================
// INITIALISE
// ==================================================

resetGame();

showScreen(getCurrentScreen());