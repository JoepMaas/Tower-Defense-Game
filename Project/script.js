const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthText = document.getElementById("health");
const goldText = document.getElementById("gold");
const waveText = document.getElementById("wave");

let health = 100;
let gold = 300;
let wave = 1;
let selectedTower = null;
let gamemode = "normal";
let waveInProgress = false;

const towers = [];
const enemies = [];
const bullets = [];

const path = [
  { x: 0, y: 250 },
  { x: 250, y: 250 },
  { x: 250, y: 120 },
  { x: 600, y: 120 },
  { x: 600, y: 420 },
  { x: 1000, y: 420 }
];

function startGame(mode) {

  gamemode = mode;

  wave = 1;
  health = 100;
  gold = 300;

  if (mode === "hard") {
    health = 75;
    gold = 200;
  }

  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("gameUI").style.display = "flex";

  updateUI();

  waveInProgress = true;

  spawnWave();

  setTimeout(() => {
    waveInProgress = false;
  }, 1000);

  gameLoop();
}

function updateUI() {
  healthText.textContent = health;
  goldText.textContent = gold;
  waveText.textContent = wave;
}

function selectTower(type) {
  selectedTower = type;
}

canvas.addEventListener("click", (e) => {

  if (!selectedTower) return;

  const rect = canvas.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // CHECK IF CLICK IS ON PATH
  for (let i = 0; i < path.length - 1; i++) {

    const p1 = path[i];
    const p2 = path[i + 1];

    const minX = Math.min(p1.x, p2.x) - 35;
    const maxX = Math.max(p1.x, p2.x) + 35;

    const minY = Math.min(p1.y, p2.y) - 35;
    const maxY = Math.max(p1.y, p2.y) + 35;

    // BLOCK PLACING ON ROAD
    if (
      x >= minX &&
      x <= maxX &&
      y >= minY &&
      y <= maxY
    ) {
      return;
    }
  }

  // PREVENT TOWERS OVERLAPPING
  for (let tower of towers) {

    const dx = tower.x - x;
    const dy = tower.y - y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 45) {
      return;
    }
  }

  let cost = 100;
  let range = 140;
  let fireRate = 60;
  let damage = 10;
  let color = "blue";

  if (selectedTower === "rapid") {
    cost = 150;
    range = 110;
    fireRate = 20;
    damage = 5;
    color = "yellow";
  }

  if (selectedTower === "sniper") {
    cost = 250;
    range = 260;
    fireRate = 120;
    damage = 40;
    color = "purple";
  }

  if (gold >= cost) {

    gold -= cost;

    towers.push({
      x,
      y,
      range,
      fireRate,
      damage,
      color,
      cooldown: 0
    });

    updateUI();
  }
});

class Enemy {
  constructor(speed, hp, color) {
    this.x = path[0].x;
    this.y = path[0].y;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.color = color;
    this.pathIndex = 0;
    this.radius = 15;
  }

  update() {
    const target = path[this.pathIndex + 1];

    if (!target) {
      health -= 10;
      updateUI();

      enemies.splice(enemies.indexOf(this), 1);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.pathIndex++;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "red";
    ctx.fillRect(this.x - 18, this.y - 24, 36, 5);

    ctx.fillStyle = "lime";
    ctx.fillRect(
      this.x - 18,
      this.y - 24,
      36 * (this.hp / this.maxHp),
      5
    );
  }
}

class Bullet {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = 6;
  }

  update() {
    if (!this.target) return;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;

    if (dist < 10) {
      this.target.hp -= this.damage;

      if (this.target.hp <= 0) {
        gold += 25;
        updateUI();

        enemies.splice(enemies.indexOf(this.target), 1);
      }

      bullets.splice(bullets.indexOf(this), 1);
    }
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function spawnWave() {
  let enemyCount = 4 + wave;

  if (gamemode === "hard") {
    enemyCount += 2;
  }

  if (gamemode === "endless") {
    enemyCount += wave;
  }

  for (let i = 0; i < enemyCount; i++) {
    setTimeout(() => {

      // LOWER HP
      let hp = 20 + wave * 5;

      // SLOWER ENEMIES
      let speed = 0.8 + wave * 0.03;

      if (gamemode === "hard") {
        hp *= 1.25;
        speed += 0.2;
      }

      enemies.push(
        new Enemy(
          speed,
          hp,
          `hsl(${Math.random() * 360}, 70%, 55%)`
        )
      );

    }, i * 1400); // SLOWER SPAWN RATE
  }
}

function update() {

  // UPDATE ENEMIES
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
  }

  // UPDATE TOWERS
  towers.forEach(tower => {

    tower.cooldown--;

    const target = enemies.find(enemy => {
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;

      return Math.sqrt(dx * dx + dy * dy) <= tower.range;
    });

    if (target && tower.cooldown <= 0) {

      bullets.push(
        new Bullet(
          tower.x,
          tower.y,
          target,
          tower.damage
        )
      );

      tower.cooldown = tower.fireRate;
    }

  });

  // UPDATE BULLETS
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
  }

  // PREVENT WAVE BUG
  if (
    enemies.length === 0 &&
    !waveInProgress
  ) {

    waveInProgress = true;

    setTimeout(() => {

      wave++;
      updateUI();

      spawnWave();

      waveInProgress = false;

    }, 2000);
  }

  // GAME OVER
  if (health <= 0) {
    endGame(false);
  }
}

function drawPath() {
  ctx.strokeStyle = "#b88b4a";
  ctx.lineWidth = 50;

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);

  for (let point of path) {
    ctx.lineTo(point.x, point.y);
  }

  ctx.stroke();
}

function drawTowers() {
  towers.forEach(tower => {
    ctx.fillStyle = tower.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPath();
  drawTowers();

  enemies.forEach(enemy => enemy.draw());
  bullets.forEach(bullet => bullet.draw());
}

function endGame(victory) {

  const endScreen =
    document.getElementById("endScreen");

  const endTitle =
    document.getElementById("endTitle");

  const endStats =
    document.getElementById("endStats");

  endScreen.style.display = "flex";

  if (victory) {
    endTitle.textContent = "Victory!";
  } else {
    endTitle.textContent = "Game Over";
  }

  endStats.textContent =
    `You reached wave ${wave}`;
}

function gameLoop() {
  update();
  draw();

  requestAnimationFrame(gameLoop);
}