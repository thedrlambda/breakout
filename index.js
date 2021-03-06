"use strict";
let canvasElem = document.getElementById("canvas");
let canvasBounds = canvasElem.getBoundingClientRect();
const POWER_UP_RADIUS = 10;
class ExtraBall {
    color() {
        return "grey";
    }
    execute(x, y) {
        balls.push(new Ball(x, y, 10, 2 * Math.random(), -3));
    }
}
class FlamingBall {
    color() {
        return "blue";
    }
    execute(x, y) {
        balls.push(new Ball(x, y, 10, 2 * Math.random(), -3, -1));
    }
}
class PaddleSize {
    color() {
        return "green";
    }
    execute(x, y) {
        bat.increaseSize();
    }
}
class PaddleSpeed {
    color() {
        return "red";
    }
    execute(x, y) {
        bat.increaseSpeed();
    }
}
class Explosion {
    color() {
        return "#710193";
    }
    execute(x, y) {
        let num = ~~(Math.random() * 5) + 5;
        for (let i = 0; i < num; i++)
            balls.push(new Ball(x, y, 3, 3 * Math.cos((Math.PI / (num + 1)) * (i + 1)), -3 * Math.sin((Math.PI / (num + 1)) * (i + 1)), 3));
    }
}
const powerUpTypes = [
    new ExtraBall(),
    new PaddleSize(),
    new PaddleSpeed(),
    new Explosion(),
    new FlamingBall(),
];
function randomPowerUp() {
    return powerUpTypes[~~(powerUpTypes.length * Math.random())];
}
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.taken = false;
    }
    update(bat) {
        this.y += 1;
        let coll = this.collidesWith(bat);
        if (coll !== CollisionDir.NONE) {
            this.type.execute(this.x, this.y);
            this.taken = true;
        }
    }
    isAlive() {
        return !this.taken && this.y - POWER_UP_RADIUS < canvasBounds.height;
    }
    collidesWith(bat) {
        return bat.collidesWith(this.x, this.y, POWER_UP_RADIUS);
    }
    draw(ctx) {
        ctx.fillStyle = this.type.color();
        ctx.beginPath();
        ctx.arc(this.x, this.y, POWER_UP_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "black";
    }
}
class Ball {
    constructor(x, y, r, vx, vy, hitPoint) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.vx = vx;
        this.vy = vy;
        this.hitPoint = hitPoint;
    }
    getX() {
        return this.x;
    }
    update(bat, wall) {
        this.x += this.vx;
        this.y += this.vy;
        if (0 > this.x + this.vx - this.r ||
            this.x + this.vx + this.r >= canvasBounds.width) {
            this.vx = -this.vx;
        }
        if (0 > this.y + this.vy - this.r) {
            this.vy = -this.vy;
        }
        if (this.y + this.vy + this.r >= canvasBounds.height) {
            // TODO:
            // this.vy = -this.vy;
        }
        if (this.hitPoint !== -1) {
            let coll = this.collidesWith(bat);
            if (coll === CollisionDir.SIDE) {
                this.vx = -this.vx;
            }
            else if (coll === CollisionDir.TOP) {
                this.vy = -this.vy;
            }
            if (coll !== CollisionDir.NONE && swing > 0) {
                this.vx *= 1.1;
                this.vy *= 1.1;
            }
            if (this.hitPoint && coll !== CollisionDir.NONE)
                this.hitPoint--;
        }
        wall.forEach((x) => {
            let coll = this.collidesWith(x);
            if (this.hitPoint !== -1) {
                if (coll === CollisionDir.SIDE) {
                    this.vx = -this.vx;
                }
                else if (coll === CollisionDir.TOP) {
                    this.vy = -this.vy;
                }
                if (this.hitPoint !== undefined && coll !== CollisionDir.NONE)
                    this.hitPoint--;
            }
        });
    }
    isAlive() {
        return ((this.hitPoint === undefined || this.hitPoint != 0) &&
            this.y - POWER_UP_RADIUS < canvasBounds.height);
    }
    draw(ctx) {
        if (this.hitPoint === -1)
            ctx.fillStyle = "#cc0000";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "black";
    }
    collidesWith(bat) {
        return bat.collidesWith(this.x + this.vx, this.y + this.vy, this.r);
    }
}
var CollisionDir;
(function (CollisionDir) {
    CollisionDir[CollisionDir["TOP"] = 0] = "TOP";
    CollisionDir[CollisionDir["SIDE"] = 1] = "SIDE";
    CollisionDir[CollisionDir["NONE"] = 2] = "NONE";
})(CollisionDir || (CollisionDir = {}));
const PADDLE_HEIGHT = 20;
const INIT_PADDLE_WIDTH = 100;
class Paddle {
    constructor() {
        this.x = (canvasBounds.width - INIT_PADDLE_WIDTH) / 2;
        this.y = canvasBounds.height - 2 * PADDLE_HEIGHT;
        this.w = INIT_PADDLE_WIDTH;
        this.speed = 1;
    }
    increaseSize() {
        this.w += 10;
    }
    increaseSpeed() {
        this.speed += 0.1;
    }
    update(ball) {
        if (!playerControlled) {
            let d = this.x + this.w / 2 - ball.getX();
            if (d < -10)
                this.x += this.speed * 1.5;
            else if (d > 10)
                this.x -= this.speed * 1.5;
        }
        else {
            if (leftDown)
                this.x -= this.speed * 1.5;
            if (rightDown)
                this.x += this.speed * 1.5;
            if (swing > 0)
                swing--;
        }
    }
    draw(ctx) {
        if (swing > 0)
            ctx.strokeStyle = "red";
        ctx.strokeRect(this.x, this.y, this.w, PADDLE_HEIGHT);
        if (swing > 0)
            ctx.strokeStyle = "black";
    }
    collidesWith(x, y, r) {
        let testX = x;
        let testY = y;
        let dir = CollisionDir.NONE;
        // which edge is closest?
        if (x < this.x) {
            testX = this.x;
            dir = CollisionDir.SIDE;
        }
        else if (x > this.x + this.w) {
            testX = this.x + this.w; // right edge
            dir = CollisionDir.SIDE;
        }
        // top edge
        if (y < this.y) {
            testY = this.y;
            dir = CollisionDir.TOP;
        }
        let distX = x - testX;
        let distY = y - testY;
        let distance = Math.hypot(distX, distY);
        if (distance <= r) {
            return dir;
        }
        else {
            return CollisionDir.NONE;
        }
    }
}
const BRICK_SPACING = 10;
const BRICK_WIDTH = 40;
const BRICK_HEIGHT = 15;
class Brick {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.hitPoints = color.length - 1;
    }
    draw(ctx) {
        ctx.fillStyle = this.color[this.hitPoints];
        ctx.fillRect(this.x, this.y, BRICK_WIDTH, BRICK_HEIGHT);
        ctx.fillStyle = "black";
    }
    collidesWith(x, y, r) {
        let testX = x;
        let testY = y;
        let dir = CollisionDir.NONE;
        if (x < this.x) {
            testX = this.x;
            dir = CollisionDir.SIDE;
        }
        else if (x > this.x + BRICK_WIDTH) {
            testX = this.x + BRICK_WIDTH;
            dir = CollisionDir.SIDE;
        }
        if (y < this.y) {
            testY = this.y;
            dir = CollisionDir.TOP;
        }
        else if (y > this.y + BRICK_HEIGHT) {
            testY = this.y + BRICK_HEIGHT;
            dir = CollisionDir.TOP;
        }
        let distX = x - testX;
        let distY = y - testY;
        let distance = Math.hypot(distX, distY);
        if (distance <= r) {
            this.hitPoints--;
            if (this.hitPoints < 0 && Math.random() < 0.75)
                powerUps.push(new PowerUp(this.x + BRICK_WIDTH / 2, this.y, randomPowerUp()));
            return dir;
        }
        else {
            return CollisionDir.NONE;
        }
    }
    isAlive() {
        return this.hitPoints >= 0;
    }
}
let ball = new Ball(canvasBounds.width / 2, canvasBounds.height - 100, 10, 2 * Math.random(), 3);
let balls = [ball];
let bat = new Paddle();
let wall = [];
let powerUps = [
    new PowerUp(canvasBounds.width / 2, canvasBounds.height - 100, new Explosion()),
];
let wx = ~~(canvasBounds.width / (BRICK_WIDTH + BRICK_SPACING));
let offset = (canvasBounds.width - wx * (BRICK_WIDTH + BRICK_SPACING) + BRICK_SPACING) / 2;
for (let x = 0; x < wx; x++)
    for (let y = 0; y < 13; y++)
        wall.push(new Brick((BRICK_SPACING + BRICK_WIDTH) * x + offset, (BRICK_SPACING + BRICK_HEIGHT) * y + BRICK_SPACING, ["#cc0000", "#ffcc00", "#00aa00"]));
function draw() {
    let ctx = canvasElem.getContext("2d");
    ctx.clearRect(0, 0, canvasBounds.width, canvasBounds.height);
    balls.forEach((x) => x.draw(ctx));
    bat.draw(ctx);
    wall.forEach((w) => w.draw(ctx));
    powerUps.forEach((w) => w.draw(ctx));
}
function update() {
    bat.update(ball);
    powerUps.forEach((w) => w.update(bat));
    powerUps = powerUps.filter((x) => x.isAlive());
    balls.forEach((x) => x.update(bat, wall));
    balls = balls.filter((x) => x.isAlive());
    wall = wall.filter((x) => x.isAlive());
}
const FPS = 60;
const SLEEP = 1000 / FPS;
function gameLoop() {
    let before = Date.now();
    update();
    draw();
    let after = Date.now();
    let sleep = SLEEP - (after - before);
    if (sleep < 5)
        console.log("Stayed up all night!");
    setTimeout(() => gameLoop(), sleep);
}
let playerControlled = false;
let leftDown = false;
let rightDown = false;
let swing = -1;
const LEFT_KEY = 37;
const UP_KEY = 38;
const RIGHT_KEY = 39;
const DOWN_KEY = 40;
window.addEventListener("keydown", (e) => {
    playerControlled = true;
    if (e.keyCode === LEFT_KEY || e.key === "a") {
        leftDown = true;
    }
    else if (e.keyCode === RIGHT_KEY || e.key === "d") {
        rightDown = true;
    }
    else if (e.key === " " && swing < 0) {
        swing = 10;
    }
});
window.addEventListener("keyup", (e) => {
    if (e.keyCode === LEFT_KEY || e.key === "a") {
        leftDown = false;
    }
    else if (e.keyCode === RIGHT_KEY || e.key === "d") {
        rightDown = false;
    }
    else if (e.key === " ") {
        swing = -1;
    }
});
gameLoop();
