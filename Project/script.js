const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const healthText = document.getElementById("health");
const goldText = document.getElementById("gold");
const waveText = document.getElementById("wave");

let paused = false;
let gameRunning = false; // ADD at the top with your other let variables
let gameSpeed = 1;

const MAX_NORMAL_WAVE = 20;
const MAX_HARD_WAVE = 30;
let gameEnded = false;
let health = 100;
let gold = 300;
let wave = 1;
let selectedTower = null;
let gamemode = "normal";
let waveInProgress = false;
let selectedTowerForUpgrade = null;
let selectedGamemode = "normal";
let currentMap = "classic";
document.getElementById("mapName").textContent =
  currentMap;

const towers = [];
const enemies = [];
const bullets = [];
const particles = [];

let path = [];

const maps = {

  classic: [
    { x: 0, y: 250 },
    { x: 250, y: 250 },
    { x: 250, y: 120 },
    { x: 600, y: 120 },
    { x: 600, y: 420 },
    { x: 1000, y: 420 }
  ],

  snake: [
    { x: 0, y: 100 },
    { x: 850, y: 100 },
    { x: 850, y: 220 },
    { x: 150, y: 220 },
    { x: 150, y: 350 },
    { x: 850, y: 350 },
    { x: 850, y: 500 },
    { x: 1000, y: 500 }
  ],

  cross: [
    { x: 0, y: 300 },
    { x: 350, y: 300 },
    { x: 350, y: 100 },
    { x: 650, y: 100 },
    { x: 650, y: 500 },
    { x: 1000, y: 500 }
  ],

  spiral: [
    { x: 0, y: 300 },
    { x: 850, y: 300 },
    { x: 850, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 450 },
    { x: 700, y: 450 },
    { x: 700, y: 220 },
    { x: 1000, y: 220 }
  ]

};

function checkVictory() {

  if (gamemode === "endless") {
    return false;
  }

  if (
    gamemode === "normal" &&
    wave >= MAX_NORMAL_WAVE &&
    enemies.length === 0
  ) {
    return true;
  }

  if (
    gamemode === "hard" &&
    wave >= MAX_HARD_WAVE &&
    enemies.length === 0
  ) {
    return true;
  }

  return false;
}

function startGame(mode) {

  selectedGamemode = mode;

  document.getElementById("mainMenu").style.display = "none";
  document.getElementById("mapMenu").style.display = "flex";

}

function updateUI() {
  healthText.textContent = health;
  goldText.textContent = gold;
  waveText.textContent = wave;
}

function selectTower(type) {
  selectedTower = type;
}

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  selectedTowerForUpgrade = null;

  for (let tower of towers) {
    const dx = tower.x - x;
    const dy = tower.y - y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      selectedTowerForUpgrade = tower;
      openUpgradeUI(tower);
      break;
    }
  }
});

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

  let color = "#3498db";
  let type = "basic";

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
  if (selectedTower === "splash") {
    cost = 300;
    range = 150;
    fireRate = 90;
    damage = 35;
    color = "#ff6600";
    type = "splash";
  }

  if (selectedTower === "freeze") {
    cost = 275;
    range = 170;
    fireRate = 80;
    damage = 8;
    color = "#00d4ff";
    type = "freeze";
  }

  if (selectedTower === "laser") {
    cost = 500;
    range = 220;
    fireRate = 10;
    damage = 8;
    color = "#ff00ff";
    type = "laser";
  }

  if (selectedTower === "poison") {
    cost = 350;
    range = 180;
    fireRate = 70;
    damage = 12;
    color = "#00ff55";
    type = "poison";
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
      type,
      cooldown: 0,
      level: 1,
      baseRange: range,
      baseDamage: damage,

      totalSpent: cost
    });

    updateUI();
  }
});

class Enemy {
  constructor(speed, hp, color, isBoss = false, type = "normal") {
    this.x = path[0]?.x || 0;
    this.y = path[0]?.y || 0;
    this.slowTimer = 0;
    this.poisonTimer = 0;

    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;

    this.color = color;
    this.type = type;
    this.pathIndex = 0;

    this.isBoss = isBoss;

    this.radius = isBoss ? 30 : 15;

    // FAST
    if (type === "fast") {
      this.speed *= 1.8;
      this.hp *= 0.6;
      this.maxHp = this.hp;
      this.color = "#00ffff";
    }

    // TANK
    if (type === "tank") {
      this.speed *= 0.6;
      this.hp *= 4;
      this.maxHp = this.hp;
      this.radius = 22;
      this.color = "#8b4513";
    }

    // REGEN
    if (type === "regen") {
      this.color = "#00ff55";
    }

    // SPLITTER
    if (type === "splitter") {
      this.hp *= 2;
      this.maxHp = this.hp;
      this.color = "#ff66ff";
    }
  }

  update() {
  if (paused) return;

  if (this.hp <= 0) {
    gold += this.isBoss ? 300 : 25;
    const index = enemies.indexOf(this);
    if (index !== -1) enemies.splice(index, 1);
    updateUI();
    return;
  }

  // Regen healing
  if (this.type === "regen") {
    this.hp = Math.min(this.maxHp, this.hp + 0.05);
  }

  // Slow effect
  let actualSpeed = this.speed;
  if (this.slowTimer > 0) {
    actualSpeed *= 0.25;
    this.slowTimer--;
  }

  // Poison effect
  if (this.poisonTimer > 0) {
    this.hp -= 0.25;
    this.poisonTimer--;
    if (this.hp <= 0) {
      gold += this.isBoss ? 300 : 25;
      updateUI();
      const index = enemies.indexOf(this);
      if (index !== -1) enemies.splice(index, 1);
      return;
    }
  }

  // Movement
  const target = path[this.pathIndex + 1];
  if (!target) {
    health -= 10;
    if (health <= 0) { health = 0; updateUI(); endGame(false); return; }
    updateUI();
    this.dead = true;
    return;
  }

  const dx = target.x - this.x;
  const dy = target.y - this.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < actualSpeed) {
    this.pathIndex++;
  } else {
    this.x += (dx / dist) * actualSpeed;
    this.y += (dy / dist) * actualSpeed;
  }
}
  draw() {
      if (this.slowTimer > 0) {

        ctx.strokeStyle = "#00d4ff";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 4,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      if (this.poisonTimer > 0) {

        ctx.strokeStyle = "#00ff55";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 8,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      if (this.finalBoss) {

        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 8;

        ctx.beginPath();

        ctx.arc(
          this.x,
          this.y,
          this.radius + 12,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle = "gold";

        ctx.font = "bold 20px Arial";

        ctx.fillText(
          "FINAL BOSS",
          this.x - 55,
          this.y - 50
        );
      }
      updateBossBar();
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


      if (this.isBoss) {

        ctx.strokeStyle = "gold";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.radius + 5,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText(
          "BOSS",
          this.x - 22,
          this.y - 40
        );
      }
 }
}


function loadMap(mapName) {

  currentMap = mapName;

  updateMapName();

  path = maps[mapName];

  document.getElementById("mapMenu").style.display = "none";
  document.getElementById("gameContainer").style.display = "flex";

  startActualGame();
}

function startActualGame() {
  gamemode = selectedGamemode;
  wave = 1;
  gold = 300;
  health = 100;

  if (gamemode === "hard") {
    gold = 200;
    health = 75;
  }

  updateUI();
  waveInProgress = true;
  gameEnded = false;
  gameRunning = true; // ADD THIS

  spawnWave();
  setTimeout(() => { waveInProgress = false; }, 1000);
  gameLoop();
}

class Bullet {
  constructor(x, y, target, damage, towerType) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = 6;
    this.towerType = towerType;
  }

  update() {
    if (paused) return; // ADD THIS

    if (!this.target || !enemies.includes(this.target) || this.target.dead) {
      bullets.splice(bullets.indexOf(this), 1);
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    // ✅ TRUE HIT CHECK (BEFORE overshooting)
    if (dist < this.speed + this.target.radius) {

      console.log("HIT:", this.damage);

      this.target.hp -= this.damage;

      if (this.towerType === "freeze") {
        this.target.slowTimer = 240;
      }

      if (this.towerType === "poison") {
        this.target.poisonTimer = 180;
      }
      if (this.target.hp <= 0) {

        if (
          this.target.type === "splitter"
        ) {

          for (let i = 0; i < 2; i++) {

            const child =
              new Enemy(
                2.2,
                12,
                "#ff99ff"
              );

            child.x = this.target.x;
            child.y = this.target.y;

            child.pathIndex =
              this.target.pathIndex;

            enemies.push(child);
          }
        }

        for (let i = 0; i < 12; i++) {

          particles.push(
            new Particle(
              this.target.x,
              this.target.y,
              this.target.color
            )
          );
        }
      }

      bullets.splice(bullets.indexOf(this), 1);
      return;
    }

    // MOVE
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;
  }
  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Particle {

  constructor(x, y, color) {

    this.x = x;
    this.y = y;

    this.vx =
      (Math.random() - 0.5) * 5;

    this.vy =
      (Math.random() - 0.5) * 5;

    this.life = 30;

    this.color = color;
  }

  update() {
  this.x += this.vx;
  this.y += this.vy;
  this.life--;
}

  draw() {

    ctx.globalAlpha =
      this.life / 30;

    ctx.fillStyle =
      this.color;

    ctx.beginPath();

    ctx.arc(
      this.x,
      this.y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;
  }
}


function spawnWave() {

  // BOSS WAVE EVERY 5 WAVES
  if (wave % 5 === 0) {
    showBossWarning();

    let bossHP = 500 + (wave * 150);

    const bossSpeed = 0.7 + (wave * 0.01);

    const finalBoss =
      (
        gamemode === "normal" &&
        wave === 20
      )
      ||
      (
        gamemode === "hard" &&
        wave === 30
      );

    if (finalBoss) {

      bossHP *= 5;

      enemies.push(
        new Enemy(
          bossSpeed,
          bossHP,
          "#ff0000",
          true
        )
      );

      enemies[enemies.length - 1].finalBoss = true;

      return;
    }

    enemies.push(
      new Enemy(
        bossSpeed,
        bossHP,
        "#ff3333",
        true
      )
    );

    return;
  }

  let enemyCount = 4 + wave;

  if (gamemode === "hard") {
    enemyCount += 2;
  }

  if (gamemode === "endless") {
    enemyCount += wave;
  }

  for (let i = 0; i < enemyCount; i++) {

    setTimeout(() => {

      let hp = 20 + wave * 5;
      let speed = 0.8 + wave * 0.03;

      if (gamemode === "hard") {
        hp *= 1.25;
        speed += 0.2;
      }

      let type = "normal";

      const rand = Math.random();

      if (rand < 0.15)
        type = "fast";

      else if (rand < 0.25)
        type = "tank";

      else if (rand < 0.35)
        type = "regen";

      else if (rand < 0.42)
        type = "splitter";

      enemies.push(
        new Enemy(
          speed,
          hp,
          `hsl(${Math.random() * 360},70%,55%)`,
          false,
          type
        )
      );
    }, i * 1400);

  }
}

function update() {

  // UPDATE TOWERS
towers.forEach(tower => {
  if (paused) return; // ADD THIS

  tower.cooldown--;

  const target = enemies.find(enemy => {
    const dx = enemy.x - tower.x;
    const dy = enemy.y - tower.y;
    return Math.sqrt(dx * dx + dy * dy) <= tower.range;
  });

  if (target && tower.cooldown <= 0) {
    bullets.push(new Bullet(tower.x, tower.y, target, tower.damage, tower.type));
    tower.cooldown = tower.fireRate;
  }
});

  if (this.hp <= 0) {

    gold += this.isBoss ? 300 : 25;

    const index = enemies.indexOf(this);

    if (index !== -1) {
      enemies.splice(index, 1);
    }

    updateUI();

    return;
  }

  // UPDATE ENEMIES
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (!enemy) continue;

    for (let s = 0; s < gameSpeed; s++) {
      enemy.update();
    }
  }

  // REMOVE DEAD ENEMIES
  for (let i = enemies.length - 1; i >= 0; i--) {

    if (enemies[i].dead) {

      const enemy = enemies[i];

      // 💰 REWARD LOGIC
      gold += enemy.isBoss ? 300 : 25;

      updateUI();

      enemies.splice(i, 1);
    }
  }

  // UPDATE TOWERS  ✅ MUST BE HERE
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
          tower.damage,
          tower.type
        )
      );

      tower.cooldown = tower.fireRate;
    }
  });

  // UPDATE BULLETS
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let s = 0; s < gameSpeed; s++) {
      if (bullets[i]) bullets[i].update();
    }
  }

  // WAVE LOGIC
 if (enemies.length === 0 && !waveInProgress) {
  waveInProgress = true;

  // Check victory immediately before doing anything else
  if (checkVictory()) {
    endGame(true);
    return;
  }

  setTimeout(() => {
    const maxWave = gamemode === "hard" ? MAX_HARD_WAVE : MAX_NORMAL_WAVE;

    if (gamemode !== "endless" && wave >= maxWave) {
      if (checkVictory()) endGame(true);
      return;
    }

    wave++;
    showWaveBanner();
    updateUI();
    spawnWave();
    waveInProgress = false;
  }, 2000);
}
}

function drawPath() {

  if (!path.length) return;

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

    const gradient = ctx.createRadialGradient(
      tower.x,
      tower.y,
      5,
      tower.x,
      tower.y,
      20
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(1, tower.color);

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(
      tower.x,
      tower.y,
      20,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // SHOW RANGE ONLY IF HOVERED
    if (tower === hoveredTower) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    // LEVEL TEXT
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Lv ${tower.level}`, tower.x - 12, tower.y - 25);
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  switch (currentMap) {

    case "classic":
      ctx.fillStyle = "#1d5c2c";
      break;

    case "snake":
      ctx.fillStyle = "#264653";
      break;

    case "cross":
      ctx.fillStyle = "#3a5a40";
      break;

    case "spiral":
      ctx.fillStyle = "#4a4e69";
      break;
  }

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawPath();
  drawTowers();

  particles.forEach(
    particle => particle.draw()
  );

  enemies.forEach(enemy => enemy.draw());
  bullets.forEach(bullet => bullet.draw());
}

function endGame(victory) {
  if (gameEnded) return;
  gameEnded = true;
  gameRunning = false; // ADD THIS — kills the loop

  const endScreen = document.getElementById("endScreen");
  const endTitle = document.getElementById("endTitle");
  const endStats = document.getElementById("endStats");

  endScreen.style.display = "flex";

  if (victory) {
    endTitle.textContent = "Victory!";
    endStats.textContent = `You completed ${gamemode.toUpperCase()} mode!`;
    setTimeout(() => { returnToMainMenu(); }, 5000);
  } else {
    endTitle.textContent = "Game Over";
    endStats.textContent = `You survived until wave ${wave}`;
  }
}

function gameLoop() {
  if (!gameRunning) return; // CHANGED
  update();
  draw();
  requestAnimationFrame(gameLoop);
} 
let hoveredTower = null;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  hoveredTower = null;

  for (let tower of towers) {
    const dx = tower.x - x;
    const dy = tower.y - y;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      hoveredTower = tower;
      break;
    }
  }
});

function openUpgradeUI(tower) {

  document.getElementById("upgradeUI").style.display = "flex";


  const upgradeCost = 100 * tower.level;
  const sellPrice =
    Math.floor(tower.totalSpent * 0.75);

  document.getElementById("towerInfo").innerHTML = `
Level: ${tower.level}<br>
Damage: ${tower.damage}<br>
Range: ${tower.range}<br>
Upgrade Cost: $${upgradeCost}<br>
Sell Value: $${sellPrice}<br><br>

<b>Hotkeys</b><br>
U = Upgrade<br>
X = Sell<br>
ESC = Close
`;
}

function closeUpgradeUI() {
  document.getElementById("upgradeUI").style.display = "none";
  selectedTowerForUpgrade = null;
}

function upgradeTower() {
  if (!selectedTowerForUpgrade) return;

  const tower = selectedTowerForUpgrade;

  const cost = 100 * tower.level;

  if (gold < cost) return;

  gold -= cost;

  tower.totalSpent += cost;

  tower.level++;

  // SCALE STATS
  tower.damage = Math.floor(tower.baseDamage * (1 + tower.level * 0.35));
  tower.range = tower.baseRange + tower.level * 20;
  tower.fireRate = Math.max(10, tower.fireRate - 3);

  updateUI();
  openUpgradeUI(tower);
}

function showBossWarning() {

  const warning = document.createElement("div");

  warning.innerText = "⚠ BOSS WAVE ⚠";

  warning.style.position = "absolute";
  warning.style.top = "50%";
  warning.style.left = "50%";
  warning.style.transform = "translate(-50%, -50%)";

  warning.style.fontSize = "60px";
  warning.style.fontWeight = "bold";
  warning.style.color = "red";

  document.body.appendChild(warning);

  setTimeout(() => {
    warning.remove();
  }, 2500);
}

function sellTower() {

  if (!selectedTowerForUpgrade) return;

  const tower = selectedTowerForUpgrade;

  const sellPrice = Math.floor(
    tower.totalSpent * 0.75
  );

  gold += sellPrice;

  const index = towers.indexOf(tower);

  if (index > -1) {
    towers.splice(index, 1);
  }

  updateUI();

  closeUpgradeUI();
}

function updateMapName() {

  const mapText =
    document.getElementById("mapName");

  if (mapText) {
    mapText.textContent = currentMap;
  }

}

function returnToMainMenu() {
  gameRunning = false; // Ensure loop is dead
  gameEnded = true;

  health = 100;
  gold = 300;
  wave = 1;
  waveInProgress = false;
  paused = false;
  gameSpeed = 1;

  towers.length = 0;
  enemies.length = 0;
  bullets.length = 0;
  particles.length = 0; // ADDED — was missing before

  selectedTower = null;
  selectedTowerForUpgrade = null;
  hoveredTower = null; // ADDED — was missing before

  document.getElementById("gameContainer").style.display = "none";
  document.getElementById("upgradeUI").style.display = "none";
  document.getElementById("endScreen").style.display = "none";
  document.getElementById("mapMenu").style.display = "none";
  document.getElementById("mainMenu").style.display = "flex";

  // Reset pause button text in case it was paused
  document.getElementById("pauseBtn").textContent = "Pause";

  updateUI();
}

function updateBossBar() {

  const boss = enemies.find(e => e.isBoss);

  const container =
    document.getElementById("bossContainer");

  const bar =
    document.getElementById("bossBarInner");

  if (!boss) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";

  const percent =
    (boss.hp / boss.maxHp) * 100;

  bar.style.width = percent + "%";
}

function togglePause() {

  paused = !paused;

  document.getElementById("pauseBtn")
    .textContent =
    paused ? "Resume" : "Pause";
}

function toggleFastForward() {

  gameSpeed =
    gameSpeed === 1 ? 2 : 1;
}

function showWaveBanner() {

  const banner =
    document.getElementById("waveBanner");

  banner.innerText =
    "Wave " + wave;

  banner.classList.add("show");

  setTimeout(() => {
    banner.classList.remove("show");
  }, 2000);
}

document.addEventListener("keydown", (e) => {

  // SPACE = Pause
  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
  }

  // F = Fast Forward
  if (e.key.toLowerCase() === "f") {
    toggleFastForward();
  }

  // U = Upgrade Tower
  if (
    e.key.toLowerCase() === "u" &&
    selectedTowerForUpgrade
  ) {
    upgradeTower();
  }

  // X = Sell Tower
  if (
    e.key.toLowerCase() === "x" &&
    selectedTowerForUpgrade
  ) {
    sellTower();
  }

  // ESC = Close Upgrade Menu
  if (e.key === "Escape") {
    closeUpgradeUI();
  }

  if (e.key === "1") selectTower("basic");
  if (e.key === "2") selectTower("rapid");
  if (e.key === "3") selectTower("sniper");
  if (e.key === "4") selectTower("splash");
  if (e.key === "5") selectTower("freeze");
  if (e.key === "6") selectTower("poison");
  if (e.key === "7") selectTower("laser");

});