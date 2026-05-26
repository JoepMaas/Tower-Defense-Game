// ═══════════════════════════════════════════════════════════
//  APEX RACERS — Main Game Script
// ═══════════════════════════════════════════════════════════

'use strict';

// ─── STATE ───────────────────────────────────────────────────
const state = {
  mode: null, // 'race' | 'lobby'
  carIndex: 0,
  carColor: 0,
  playerName: 'PLAYER',
  selectedMap: 0,
  totalLaps: 3,
  gameRunning: false,
  gamePaused: false,
  afterCarSelect: null,
  roomId: null,
  isHost: false,
  players: {},   // { id: {name, car, color, ...} }
  localId: null,
  ready: false,
  raceStarted: false,
  raceFinished: false,
};

// ─── CAR DEFINITIONS ─────────────────────────────────────────
const CARS = [
  {
    name: 'THUNDERBOLT', class: 'CLASS S · FORMULA', type: 'formula',
    stats: { Speed: 95, Accel: 90, Handling: 80, Braking: 85 },
    width: 26, height: 52, maxSpeed: 340, acceleration: 0.6,
    handling: 0.045, braking: 0.55, drift: 0.12,
  },
  {
    name: 'STALLION GT', class: 'CLASS A · GT RACER', type: 'gt',
    stats: { Speed: 85, Accel: 80, Handling: 75, Braking: 80 },
    width: 30, height: 56, maxSpeed: 280, acceleration: 0.52,
    handling: 0.038, braking: 0.48, drift: 0.15,
  },
  {
    name: 'APEX RALLY', class: 'CLASS B · RALLY CAR', type: 'rally',
    stats: { Speed: 75, Accel: 85, Handling: 90, Braking: 70 },
    width: 28, height: 50, maxSpeed: 240, acceleration: 0.58,
    handling: 0.055, braking: 0.42, drift: 0.22,
  },
  {
    name: 'IRONCLAD V8', class: 'CLASS C · MUSCLE', type: 'muscle',
    stats: { Speed: 80, Accel: 70, Handling: 60, Braking: 65 },
    width: 32, height: 58, maxSpeed: 260, acceleration: 0.48,
    handling: 0.030, braking: 0.40, drift: 0.28,
  },
];

const CAR_COLORS = [
  '#ff3c3c', '#ffb800', '#00f0ff', '#00ff88',
  '#ff44ff', '#ffffff', '#ff8800', '#4488ff',
];

// ─── MAP DEFINITIONS ─────────────────────────────────────────
const MAPS = [
  {
    name: 'CITY CIRCUIT',
    bgColor: '#1a1a2a',
    trackColor: '#333344',
    surfaceColor: '#2a2a3a',
    lineColor: '#ffffff',
    borderColor: '#ff3c3c',
    accentColor: '#ffb800',
    // Track defined as a closed polygon path (normalized 0-1)
    track: cityCircuitPath(),
    startPos: { x: 0.22, y: 0.5, angle: -Math.PI / 2 },
  },
  {
    name: 'DESERT DRAG',
    bgColor: '#1a1208',
    trackColor: '#3a3020',
    surfaceColor: '#4a3a1a',
    lineColor: '#ffdd88',
    borderColor: '#ff8800',
    accentColor: '#ffdd00',
    track: desertDragPath(),
    startPos: { x: 0.14, y: 0.5, angle: 0 },
  },
  {
    name: 'MOUNTAIN PASS',
    bgColor: '#0a1208',
    trackColor: '#2a3020',
    surfaceColor: '#1a2a1a',
    lineColor: '#88ff88',
    borderColor: '#00ff88',
    accentColor: '#00ffaa',
    track: mountainPassPath(),
    startPos: { x: 0.5, y: 0.85, angle: -Math.PI / 2 },
  },
  {
    name: 'NIGHT OVAL',
    bgColor: '#050510',
    trackColor: '#1a1a2a',
    surfaceColor: '#111120',
    lineColor: '#00f0ff',
    borderColor: '#ff44ff',
    accentColor: '#00f0ff',
    track: nightOvalPath(),
    startPos: { x: 0.5, y: 0.8, angle: Math.PI },
  },
];

function cityCircuitPath() {
  return [
    [0.08,0.25],[0.92,0.25],[0.92,0.75],[0.72,0.75],
    [0.72,0.55],[0.52,0.55],[0.52,0.75],[0.08,0.75],
  ];
}

function desertDragPath() {
  const pts = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (t < 0.45) {
      pts.push([0.1 + t * 1.8, 0.35]);
    } else if (t < 0.5) {
      const a = ((t - 0.45) / 0.05) * Math.PI;
      pts.push([0.91 + Math.sin(a) * 0.0, 0.35 + (1 - Math.cos(a)) * 0.15]);
    } else if (t < 0.95) {
      pts.push([0.91 - (t - 0.5) * 1.8, 0.65]);
    } else {
      const a = ((t - 0.95) / 0.05) * Math.PI;
      pts.push([0.1 - Math.sin(a) * 0, 0.65 - (1 - Math.cos(a)) * 0.15]);
    }
  }
  return pts;
}

function mountainPassPath() {
  const pts = [];
  const steps = 100;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = 0.28 + Math.sin(t * 3) * 0.06 + Math.cos(t * 5) * 0.03;
    pts.push([0.5 + Math.cos(t) * r * 0.9, 0.5 + Math.sin(t) * r]);
  }
  return pts;
}

function nightOvalPath() {
  const pts = [];
  for (let i = 0; i < 100; i++) {
    const t = (i / 100) * Math.PI * 2;
    pts.push([0.5 + Math.cos(t) * 0.38, 0.5 + Math.sin(t) * 0.32]);
  }
  return pts;
}

// ─── SCREEN MANAGEMENT ───────────────────────────────────────
let prevScreen = 'menuScreen';

function showScreen(id, extra) {
  prevScreen = document.querySelector('.screen:not(.hidden)')?.id || 'menuScreen';
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  if (id === 'carSelectScreen') {
    state.afterCarSelect = extra;
    updateCarPreview();
    buildColorPicker();
  }
  if (id === 'lobbyScreen') {
    buildMapSelector();
    buildPlayerList();
    updateLobbySettings();
    if (!state.localId) {
      state.localId = 'local_' + Math.random().toString(36).slice(2, 7);
      state.players[state.localId] = {
        id: state.localId,
        name: state.playerName,
        carIndex: state.carIndex,
        color: CAR_COLORS[state.carColor],
        ready: false,
        isHost: true,
        lap: 0,
        checkpoints: [],
        totalTime: 0,
        finished: false,
      };
      buildPlayerList();
      setNetStatus('local', 'LOCAL PLAY (Solo)');
      generateRoomId();
    }
  }
}

function goBack() {
  if (prevScreen === 'menuScreen' || !prevScreen) {
    showScreen('menuScreen');
  } else {
    showScreen('menuScreen');
  }
}

function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function showNotification(msg) {
  const n = document.createElement('div');
  n.className = 'notification';
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3100);
}

// ─── CAR SELECT ───────────────────────────────────────────────
function prevCar() {
  state.carIndex = (state.carIndex - 1 + CARS.length) % CARS.length;
  updateCarPreview();
}
function nextCar() {
  state.carIndex = (state.carIndex + 1) % CARS.length;
  updateCarPreview();
}

function updateCarPreview() {
  const car = CARS[state.carIndex];
  document.getElementById('carName').textContent = car.name;
  document.getElementById('carClass').textContent = car.class;
  const statsEl = document.getElementById('carStats');
  statsEl.innerHTML = Object.entries(car.stats).map(([k, v]) => `
    <div class="stat-item">
      <label>${k}</label>
      <div class="stat-bar"><div class="stat-fill" style="width:${v}%"></div></div>
    </div>
  `).join('');
  drawCarPreview();
}

function buildColorPicker() {
  const el = document.getElementById('colorPicker');
  el.innerHTML = CAR_COLORS.map((c, i) => `
    <div class="color-swatch ${i === state.carColor ? 'active' : ''}"
      style="background:${c}"
      onclick="selectColor(${i})"></div>
  `).join('');
}

function selectColor(i) {
  state.carColor = i;
  document.querySelectorAll('.color-swatch').forEach((s, idx) =>
    s.classList.toggle('active', idx === i));
  drawCarPreview();
}

function drawCarPreview() {
  const canvas = document.getElementById('carPreviewCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  const color = CAR_COLORS[state.carColor];
  drawCarShape(ctx, 0, 0, 0, CARS[state.carIndex], color, true);
  ctx.restore();
}

function drawCarShape(ctx, x, y, angle, carDef, color, preview = false) {
  const scale = preview ? 2.4 : 1;
  const w = carDef.width * scale;
  const h = carDef.height * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Shadow
  ctx.shadowColor = color;
  ctx.shadowBlur = preview ? 30 : 12;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  if (carDef.type === 'formula') {
    ctx.roundRect(-w * 0.25, -h * 0.5, w * 0.5, h, 4 * scale);
    ctx.fill();
    // Wings
    ctx.fillRect(-w * 0.55, -h * 0.42, w * 1.1, 7 * scale);
    ctx.fillRect(-w * 0.45, h * 0.32, w * 0.9, 5 * scale);
    // Cockpit
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.05, w * 0.15, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (carDef.type === 'gt') {
    ctx.roundRect(-w * 0.5, -h * 0.5, w, h, 6 * scale);
    ctx.fill();
    // Roof
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.roundRect(-w * 0.35, -h * 0.25, w * 0.7, h * 0.4, 4 * scale);
    ctx.fill();
    // Windows
    ctx.fillStyle = 'rgba(150,220,255,0.3)';
    ctx.roundRect(-w * 0.28, -h * 0.22, w * 0.56, h * 0.34, 3 * scale);
    ctx.fill();
  } else if (carDef.type === 'rally') {
    ctx.roundRect(-w * 0.5, -h * 0.5, w, h, 5 * scale);
    ctx.fill();
    // Roof scoop
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.roundRect(-w * 0.15, -h * 0.5, w * 0.3, h * 0.18, 3 * scale);
    ctx.fill();
    // Roof
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.roundRect(-w * 0.32, -h * 0.22, w * 0.64, h * 0.4, 3 * scale);
    ctx.fill();
  } else {
    ctx.roundRect(-w * 0.5, -h * 0.5, w, h, 7 * scale);
    ctx.fill();
    // Muscle hood bulge
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.1, w * 0.3, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Roof
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.roundRect(-w * 0.35, -h * 0.2, w * 0.7, h * 0.36, 4 * scale);
    ctx.fill();
  }

  // Wheels
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a1a1a';
  const wy = h * 0.28, wx = w * 0.55, wr = 5 * scale, wh2 = 9 * scale;
  [[-wx, -wy], [wx, -wy], [-wx, wy], [wx, wy]].forEach(([tx, ty]) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.beginPath();
    ctx.roundRect(-wr, -wh2, wr * 2, wh2 * 2, 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });

  // Headlights
  ctx.fillStyle = '#ffffaa';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = preview ? 8 : 4;
  ctx.fillRect(-w * 0.35, -h * 0.48, w * 0.22, 4 * scale);
  ctx.fillRect(w * 0.13, -h * 0.48, w * 0.22, 4 * scale);

  // Taillights
  ctx.fillStyle = '#ff3333';
  ctx.shadowColor = '#ff0000';
  ctx.fillRect(-w * 0.35, h * 0.44, w * 0.22, 4 * scale);
  ctx.fillRect(w * 0.13, h * 0.44, w * 0.22, 4 * scale);

  ctx.restore();
}

function confirmCarSelect() {
  if (state.afterCarSelect === 'lobby') {
    if (state.players[state.localId]) {
      state.players[state.localId].carIndex = state.carIndex;
      state.players[state.localId].color = CAR_COLORS[state.carColor];
    }
    updateLobbySettings();
    buildPlayerList();
    broadcastState();
    showScreen('lobbyScreen');
  } else {
    // Quick race
    state.totalLaps = 3;
    state.players = {};
    state.localId = 'local_' + Math.random().toString(36).slice(2, 7);
    state.players[state.localId] = {
      id: state.localId, name: 'YOU',
      carIndex: state.carIndex,
      color: CAR_COLORS[state.carColor],
      ready: true, isHost: true,
      lap: 1, checkpoints: [],
      totalTime: 0, finished: false,
    };
    state.selectedMap = Math.floor(Math.random() * MAPS.length);
    startActualRace();
  }
}

// ─── LOBBY ───────────────────────────────────────────────────
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  state.roomId = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  document.getElementById('roomIdDisplay').textContent = state.roomId;
}

function copyRoomId() {
  if (state.roomId && state.roomId !== '------') {
    navigator.clipboard.writeText(state.roomId).catch(() => {});
    showNotification('Room code copied!');
  }
}

function buildMapSelector() {
  const el = document.getElementById('mapSelector');
  el.innerHTML = MAPS.map((m, i) => `
    <div class="map-card ${i === state.selectedMap ? 'selected' : ''}" onclick="selectMap(${i})">
      <canvas width="200" height="80" id="mapPreview_${i}"></canvas>
      <div class="map-card-name">${m.name}</div>
    </div>
  `).join('');
  MAPS.forEach((_, i) => drawMapPreview(i));
}

function selectMap(i) {
  state.selectedMap = i;
  document.querySelectorAll('.map-card').forEach((c, idx) =>
    c.classList.toggle('selected', idx === i));
  updateLobbySettings();
  broadcastState();
}

function drawMapPreview(idx) {
  const canvas = document.getElementById(`mapPreview_${idx}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const map = MAPS[idx];
  ctx.fillStyle = map.bgColor;
  ctx.fillRect(0, 0, W, H);
  const pts = map.track;
  ctx.strokeStyle = map.trackColor;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    i === 0 ? ctx.moveTo(x * W, y * H) : ctx.lineTo(x * W, y * H);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.strokeStyle = map.borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function buildPlayerList() {
  const el = document.getElementById('playerList');
  const players = Object.values(state.players);
  const slots = 4;
  el.innerHTML = '';
  for (let i = 0; i < slots; i++) {
    const p = players[i];
    if (p) {
      const car = CARS[p.carIndex] || CARS[0];
      el.innerHTML += `
        <div class="player-slot">
          <div class="player-color-dot" style="background:${p.color}"></div>
          <span class="player-name">${p.name}${p.isHost ? '<span class="host-badge">HOST</span>' : ''}</span>
          <span class="player-car">${car.name}</span>
          <span class="player-ready ${p.ready ? 'yes' : 'no'}">${p.ready ? '✓ READY' : 'NOT READY'}</span>
        </div>
      `;
    } else {
      el.innerHTML += `<div class="player-slot empty"><span class="player-name" style="color:var(--muted)">Waiting for player...</span></div>`;
    }
  }
  document.getElementById('playerCount').textContent = players.length;
  document.getElementById('settingsPlayers').textContent = `${players.length} / 4`;
  checkStartButton();
}

function updateLobbySettings() {
  document.getElementById('settingsMapName').textContent = MAPS[state.selectedMap].name;
  document.getElementById('settingsLaps').textContent = state.totalLaps;
  const car = CARS[state.carIndex];
  document.getElementById('settingsCar').textContent = car.name;
}

function updateLaps() {
  state.totalLaps = parseInt(document.getElementById('lapsInput').value) || 3;
  updateLobbySettings();
  broadcastState();
}

function checkStartButton() {
  const players = Object.values(state.players);
  const allReady = players.length > 0 && players.every(p => p.ready);
  const btn = document.getElementById('startBtn');
  btn.disabled = !allReady || !state.isHost;
  if (!state.isHost) btn.title = 'Only the host can start';
}

function toggleReady() {
  state.ready = !state.ready;
  if (state.players[state.localId]) {
    state.players[state.localId].ready = state.ready;
  }
  const btn = document.getElementById('readyBtn');
  btn.textContent = state.ready ? '✗ NOT READY' : 'I\'M READY';
  btn.classList.toggle('primary', state.ready);
  buildPlayerList();
  broadcastState();
}

function startRace() {
  const players = Object.values(state.players);
  if (!players.every(p => p.ready)) {
    showNotification('All players must be ready!');
    return;
  }
  broadcastRaceStart();
  startActualRace();
}

function returnToLobby() {
  stopGame();
  state.raceStarted = false;
  state.raceFinished = false;
  Object.values(state.players).forEach(p => {
    p.ready = false;
    p.finished = false;
    p.lap = 1;
    p.checkpoints = [];
    p.totalTime = 0;
  });
  state.ready = false;
  document.getElementById('readyBtn').textContent = "I'M READY";
  document.getElementById('readyBtn').classList.remove('primary');
  showScreen('lobbyScreen');
}

function returnToMenu() {
  stopGame();
  peer?.destroy();
  peer = null;
  connections = {};
  state.localId = null;
  state.players = {};
  state.roomId = null;
  state.isHost = false;
  state.ready = false;
  setNetStatus('offline', 'Not connected');
  document.getElementById('roomIdDisplay').textContent = '------';
  showScreen('menuScreen');
}

function quitToLobby() {
  closeModal('pauseModal');
  returnToLobby();
}

// ─── CHAT ────────────────────────────────────────────────────
function chatKeyDown(e) {
  if (e.key === 'Enter') sendChatMsg();
}

function sendChatMsg() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  const payload = { type: 'chat', name: state.playerName, text: msg };
  addChatMsg(state.playerName, msg, false);
  broadcastToAll(payload);
}

function addChatMsg(name, text, system = false) {
  const el = document.getElementById('chatMessages');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'chat-msg' + (system ? ' system' : '');
  div.innerHTML = system
    ? `<em>${text}</em>`
    : `<span class="sender" style="color:${getPlayerColor(name)}">${name}:</span>${escapeHtml(text)}`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function getPlayerColor(name) {
  const p = Object.values(state.players).find(p => p.name === name);
  return p ? p.color : 'var(--muted)';
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── NETWORKING (PeerJS) ──────────────────────────────────────
let peer = null;
let connections = {};

function setNetStatus(type, msg) {
  const dot = document.getElementById('netDot');
  const status = document.getElementById('netStatus');
  if (!dot || !status) return;
  dot.className = 'net-dot ' + type;
  status.textContent = msg;
}

function loadPeerJS(cb) {
  if (window.Peer) { cb(); return; }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.1/peerjs.min.js';
  script.onload = cb;
  script.onerror = () => {
    showNotification('Could not load PeerJS. Check your connection.');
    closeModal('connectModal');
  };
  document.head.appendChild(script);
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) =>
    t.classList.toggle('active', (i === 0 && tab === 'host') || (i === 1 && tab === 'join')));
  document.getElementById('hostTab').style.display = tab === 'host' ? '' : 'none';
  document.getElementById('joinTab').style.display = tab === 'join' ? '' : 'none';
}

function createRoom() {
  const name = document.getElementById('hostNameInput').value.trim() || 'PLAYER 1';
  state.playerName = name.toUpperCase();
  state.isHost = true;
  setNetStatus('connecting', 'Connecting...');
  loadPeerJS(() => {
    const peerId = 'apexracer_' + state.roomId;
    peer = new Peer(peerId, { debug: 0 });
    peer.on('open', (id) => {
      setNetStatus('online', `Hosting: ${state.roomId}`);
      if (state.players[state.localId]) {
        state.players[state.localId].name = state.playerName;
      }
      buildPlayerList();
      closeModal('connectModal');
      showNotification('Room created! Share code: ' + state.roomId);
    });
    peer.on('connection', handleIncomingConnection);
    peer.on('error', (e) => {
      setNetStatus('offline', 'Error: ' + e.type);
      showNotification('Connection error: ' + e.type);
    });
    peer.on('disconnected', () => {
      setNetStatus('connecting', 'Reconnecting...');
      peer.reconnect();
    });
  });
}

function joinRoom() {
  const name = (document.getElementById('joinNameInput').value.trim() || 'PLAYER').toUpperCase();
  const code = document.getElementById('joinRoomInput').value.trim().toUpperCase();
  if (code.length !== 6) { showNotification('Enter a valid 6-character room code'); return; }
  state.playerName = name;
  state.isHost = false;
  setNetStatus('connecting', 'Joining ' + code + '...');
  loadPeerJS(() => {
    peer = new Peer(undefined, { debug: 0 });
    peer.on('open', (myId) => {
      state.localId = myId;
      const conn = peer.connect('apexracer_' + code, { reliable: true });
      conn.on('open', () => {
        connections[conn.peer] = conn;
        setNetStatus('online', 'Connected to ' + code);
        const payload = {
          type: 'join', id: myId, name: state.playerName,
          carIndex: state.carIndex, color: CAR_COLORS[state.carColor],
        };
        conn.send(JSON.stringify(payload));
        closeModal('connectModal');
        showNotification('Joined room ' + code + '!');
        addChatMsg('', `You joined room ${code}`, true);
      });
      conn.on('data', handleData);
      conn.on('close', () => {
        setNetStatus('offline', 'Disconnected');
        addChatMsg('', 'Lost connection to host', true);
      });
      conn.on('error', (e) => {
        setNetStatus('offline', 'Could not connect');
        showNotification('Could not join room. Check the code.');
      });
    });
    peer.on('error', (e) => {
      setNetStatus('offline', 'Error: ' + e.type);
      showNotification('Network error: ' + e.type);
    });
  });
}

function handleIncomingConnection(conn) {
  conn.on('open', () => {
    connections[conn.peer] = conn;
    conn.on('data', handleData);
    conn.on('close', () => {
      delete connections[conn.peer];
      delete state.players[conn.peer];
      buildPlayerList();
      addChatMsg('', 'A player disconnected', true);
      broadcastState();
    });
  });
}

function handleData(rawData) {
  let data;
  try { data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData; }
  catch (e) { return; }

  if (data.type === 'join') {
    state.players[data.id] = {
      id: data.id, name: data.name,
      carIndex: data.carIndex, color: data.color,
      ready: false, isHost: false,
      lap: 1, checkpoints: [], totalTime: 0, finished: false,
    };
    buildPlayerList();
    addChatMsg('', `${data.name} joined the lobby`, true);
    broadcastState();
    broadcastToAll({ type: 'chat', name: '', text: `${data.name} joined!`, system: true });
  } else if (data.type === 'state') {
    // Sync lobby state from host
    if (data.players) {
      Object.assign(state.players, data.players);
      // Keep local player's local state
      if (state.players[state.localId]) {
        state.players[state.localId].name = state.playerName;
      }
    }
    if (data.selectedMap !== undefined) state.selectedMap = data.selectedMap;
    if (data.totalLaps !== undefined) state.totalLaps = data.totalLaps;
    buildPlayerList();
    buildMapSelector();
    updateLobbySettings();
  } else if (data.type === 'chat') {
    addChatMsg(data.name, data.text, data.system);
  } else if (data.type === 'ready') {
    if (state.players[data.id]) state.players[data.id].ready = data.ready;
    buildPlayerList();
  } else if (data.type === 'raceStart') {
    state.selectedMap = data.mapIndex;
    state.totalLaps = data.laps;
    if (data.players) Object.assign(state.players, data.players);
    startActualRace();
  } else if (data.type === 'carUpdate') {
    if (state.players[data.id]) {
      Object.assign(state.players[data.id], data.car);
    }
    updateRemoteCar(data.id, data.car);
  } else if (data.type === 'lapComplete') {
    if (state.players[data.id]) {
      state.players[data.id].lap = data.lap;
      state.players[data.id].totalTime = data.totalTime;
    }
    updateLeaderboard();
  } else if (data.type === 'finished') {
    if (state.players[data.id]) {
      state.players[data.id].finished = true;
      state.players[data.id].totalTime = data.totalTime;
    }
    checkRaceFinished();
  }
}

function broadcastState() {
  broadcastToAll({
    type: 'state',
    players: state.players,
    selectedMap: state.selectedMap,
    totalLaps: state.totalLaps,
  });
}

function broadcastRaceStart() {
  broadcastToAll({
    type: 'raceStart',
    mapIndex: state.selectedMap,
    laps: state.totalLaps,
    players: state.players,
  });
}

function broadcastToAll(data) {
  const json = JSON.stringify(data);
  Object.values(connections).forEach(c => {
    try { c.send(json); } catch (e) {}
  });
}

// ─── GAME ENGINE ──────────────────────────────────────────────
let gameCanvas, gameCtx;
let minimapCanvas, minimapCtx;
let gameAnimFrame = null;
let lastTime = 0;
let countdownActive = false;
let raceStartTime = 0;
let lapStartTime = 0;

const keys = {};
const remoteCars = {};

const localCar = {
  x: 0, y: 0, angle: 0,
  vx: 0, vy: 0, speed: 0,
  steer: 0,
  onTrack: true,
  currentLap: 1,
  checkpointsPassed: new Set(),
  lapTime: 0,
  bestLap: Infinity,
  totalTime: 0,
  finished: false,
};

let currentMap = null;
let trackPolygon = [];
let checkpoints = [];
let startLine = { x1: 0, y1: 0, x2: 0, y2: 0 };

function startActualRace() {
  showScreen('gameScreen');
  gameCanvas = document.getElementById('gameCanvas');
  minimapCanvas = document.getElementById('minimapCanvas');
  gameCtx = gameCanvas.getContext('2d');
  minimapCtx = minimapCanvas.getContext('2d');

  resizeGame();
  window.addEventListener('resize', resizeGame);

  currentMap = MAPS[state.selectedMap];
  buildTrackData();
  initLocalCar();
  initRemoteCars();

  document.getElementById('hudTotalLaps').textContent = state.totalLaps;

  state.gameRunning = true;
  state.gamePaused = false;
  countdownActive = true;
  showCountdown(() => {
    raceStartTime = performance.now();
    lapStartTime = raceStartTime;
    countdownActive = false;
    gameAnimFrame = requestAnimationFrame(gameLoop);
  });
}

function resizeGame() {
  if (!gameCanvas) return;
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
}

function buildTrackData() {
  const W = window.innerWidth, H = window.innerHeight;
  const pts = currentMap.track;
  // Scale track to screen
  trackPolygon = pts.map(([x, y]) => ({ x: x * W, y: y * H }));

  // Build checkpoints along track
  checkpoints = [];
  const numCp = Math.min(pts.length, 16);
  const step = Math.floor(pts.length / numCp);
  for (let i = 0; i < numCp; i++) {
    const idx = i * step;
    const next = (idx + step) % pts.length;
    const p1 = trackPolygon[idx];
    const p2 = trackPolygon[next];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * 50, ny = dx / len * 50;
    checkpoints.push({
      x1: p1.x + nx, y1: p1.y + ny,
      x2: p1.x - nx, y2: p1.y - ny,
    });
  }

  // Start line
  const sp = currentMap.startPos;
  const sx = sp.x * W, sy = sp.y * H;
  const sa = sp.angle;
  const nx2 = Math.cos(sa + Math.PI / 2) * 60;
  const ny2 = Math.sin(sa + Math.PI / 2) * 60;
  startLine = { x1: sx + nx2, y1: sy + ny2, x2: sx - nx2, y2: sy - ny2 };
}

function initLocalCar() {
  const W = window.innerWidth, H = window.innerHeight;
  const sp = currentMap.startPos;
  const players = Object.values(state.players);
  const myIdx = players.findIndex(p => p.id === state.localId);
  const offset = (myIdx - players.length / 2 + 0.5) * 40;
  localCar.x = sp.x * W + Math.cos(sp.angle + Math.PI / 2) * offset;
  localCar.y = sp.y * H + Math.sin(sp.angle + Math.PI / 2) * offset;
  localCar.angle = sp.angle;
  localCar.vx = 0; localCar.vy = 0; localCar.speed = 0;
  localCar.currentLap = 1;
  localCar.checkpointsPassed = new Set();
  localCar.lapTime = 0;
  localCar.bestLap = Infinity;
  localCar.totalTime = 0;
  localCar.finished = false;
  localCar.steer = 0;
}

function initRemoteCars() {
  Object.keys(remoteCars).forEach(k => delete remoteCars[k]);
  const W = window.innerWidth, H = window.innerHeight;
  const sp = currentMap.startPos;
  const players = Object.values(state.players).filter(p => p.id !== state.localId);
  players.forEach((p, i) => {
    const offset = (i - players.length / 2 + 0.5) * 40;
    remoteCars[p.id] = {
      x: sp.x * W + Math.cos(sp.angle + Math.PI / 2) * (offset + 40),
      y: sp.y * H + Math.sin(sp.angle + Math.PI / 2) * (offset + 40),
      angle: sp.angle,
      speed: 0,
      lap: 1,
      name: p.name,
      color: p.color,
      carIndex: p.carIndex,
    };
  });
}

function updateRemoteCar(id, data) {
  if (remoteCars[id]) Object.assign(remoteCars[id], data);
}

// ─── INPUT ───────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Escape') {
    if (state.gameRunning) {
      if (state.gamePaused) resumeGame(); else pauseGame();
    }
    e.preventDefault();
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function pauseGame() {
  state.gamePaused = true;
  showModal('pauseModal');
  if (gameAnimFrame) { cancelAnimationFrame(gameAnimFrame); gameAnimFrame = null; }
}

function resumeGame() {
  state.gamePaused = false;
  closeModal('pauseModal');
  lastTime = performance.now();
  gameAnimFrame = requestAnimationFrame(gameLoop);
}

function stopGame() {
  state.gameRunning = false;
  state.gamePaused = false;
  if (gameAnimFrame) { cancelAnimationFrame(gameAnimFrame); gameAnimFrame = null; }
  closeModal('pauseModal');
  window.removeEventListener('resize', resizeGame);
}

// ─── GAME LOOP ───────────────────────────────────────────────
function gameLoop(timestamp) {
  if (!state.gameRunning || state.gamePaused) return;
  const dt = Math.min((timestamp - lastTime) / 16.67, 3);
  lastTime = timestamp;

  updateLocalCar(dt);
  updateHUD(timestamp);
  renderGame();

  gameAnimFrame = requestAnimationFrame(gameLoop);
}

function updateLocalCar(dt) {
  if (countdownActive || localCar.finished) return;
  const carDef = CARS[state.carIndex];
  const maxSpeed = carDef.maxSpeed;
  const accel = carDef.acceleration;
  const handle = carDef.handling;
  const brakeStr = carDef.braking;
  const drift = carDef.drift;

  const gas = keys['KeyW'] || keys['ArrowUp'];
  const brake = keys['KeyS'] || keys['ArrowDown'];
  const left = keys['KeyA'] || keys['ArrowLeft'];
  const right = keys['KeyD'] || keys['ArrowRight'];
  const handbrake = keys['Space'];

  // Surface factor
  const onTrack = isOnTrack(localCar.x, localCar.y);
  const grip = onTrack ? 1 : 0.55;
  const speedFactor = onTrack ? 1 : 0.7;

  // Steering
  const steerMax = handle * (1 - Math.abs(localCar.speed) / (maxSpeed * 1.5));
  if (left) localCar.steer -= 0.08 * dt;
  else if (right) localCar.steer += 0.08 * dt;
  else localCar.steer *= Math.pow(0.75, dt);
  localCar.steer = Math.max(-1, Math.min(1, localCar.steer));

  if (Math.abs(localCar.speed) > 5) {
    localCar.angle += localCar.steer * steerMax * dt * Math.sign(localCar.speed);
  }

  // Acceleration
  const dirX = Math.sin(localCar.angle);
  const dirY = -Math.cos(localCar.angle);

  if (gas) localCar.speed += accel * dt * speedFactor;
  else if (brake) {
    if (localCar.speed > 0) localCar.speed -= brakeStr * dt;
    else localCar.speed -= accel * 0.5 * dt;
  } else {
    // Friction
    localCar.speed *= Math.pow(0.985, dt);
  }

  if (handbrake) localCar.speed *= Math.pow(0.92, dt);

  // Clamp speed
  const maxS = maxSpeed / 30 * speedFactor;
  const minS = -(maxS * 0.35);
  localCar.speed = Math.max(minS, Math.min(maxS, localCar.speed));

  // Drift physics
  const targetVx = dirX * localCar.speed;
  const targetVy = dirY * localCar.speed;
  const driftFactor = handbrake ? 0.05 : (drift * (1 - grip * 0.3));
  localCar.vx += (targetVx - localCar.vx) * (1 - driftFactor) * Math.pow(0.85, dt);
  localCar.vy += (targetVy - localCar.vy) * (1 - driftFactor) * Math.pow(0.85, dt);

  // Boundaries
  const newX = localCar.x + localCar.vx * dt;
  const newY = localCar.y + localCar.vy * dt;

  // Wall bounce
  const W = gameCanvas.width, H = gameCanvas.height;
  localCar.x = Math.max(20, Math.min(W - 20, newX));
  localCar.y = Math.max(20, Math.min(H - 20, newY));

  if (newX <= 20 || newX >= W - 20) { localCar.vx *= -0.4; localCar.speed *= 0.5; }
  if (newY <= 20 || newY >= H - 20) { localCar.vy *= -0.4; localCar.speed *= 0.5; }

  // Checkpoint logic
  checkCheckpoints();

  // Broadcast position
  broadcastCarUpdate();
}

function isOnTrack(x, y) {
  // Point-in-polygon test
  const poly = trackPolygon;
  if (poly.length < 3) return true;

  // Expand the track polygon outward
  const expandedPoly = poly.map((pt, i) => {
    const prev = poly[(i - 1 + poly.length) % poly.length];
    const next = poly[(i + 1) % poly.length];
    const dx1 = pt.x - prev.x, dy1 = pt.y - prev.y;
    const dx2 = next.x - pt.x, dy2 = next.y - pt.y;
    const nx = -(dy1 + dy2) / 2, ny = (dx1 + dx2) / 2;
    const len = Math.sqrt(nx * nx + ny * ny) || 1;
    return { x: pt.x + (nx / len) * 55, y: pt.y + (ny / len) * 55 };
  });

  return pointInPolygon(x, y, expandedPoly) && !pointInPolygon(x, y,
    poly.map((pt, i) => {
      const prev = poly[(i - 1 + poly.length) % poly.length];
      const next = poly[(i + 1) % poly.length];
      const dx1 = pt.x - prev.x, dy1 = pt.y - prev.y;
      const dx2 = next.x - pt.x, dy2 = next.y - pt.y;
      const nx = -(dy1 + dy2) / 2, ny = (dx1 + dx2) / 2;
      const len = Math.sqrt(nx * nx + ny * ny) || 1;
      return { x: pt.x - (nx / len) * 55, y: pt.y - (ny / len) * 55 };
    }));
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function checkCheckpoints() {
  const now = performance.now();

  // Check each checkpoint
  checkpoints.forEach((cp, i) => {
    if (!localCar.checkpointsPassed.has(i)) {
      if (lineIntersects(localCar.x, localCar.y,
        localCar.x - localCar.vx * 3, localCar.y - localCar.vy * 3,
        cp.x1, cp.y1, cp.x2, cp.y2)) {
        localCar.checkpointsPassed.add(i);
      }
    }
  });

  // Check start/finish line
  if (lineIntersects(localCar.x, localCar.y,
    localCar.x - localCar.vx * 3, localCar.y - localCar.vy * 3,
    startLine.x1, startLine.y1, startLine.x2, startLine.y2)) {

    const passed = localCar.checkpointsPassed.size >= Math.floor(checkpoints.length * 0.7);
    if (passed || localCar.currentLap === 1) {
      completeLap(now);
    }
  }
}

function completeLap(now) {
  const elapsed = now - lapStartTime;
  if (elapsed < 2000) return; // prevent double trigger

  localCar.lapTime = elapsed;
  if (elapsed < localCar.bestLap) localCar.bestLap = elapsed;
  localCar.totalTime += elapsed;
  lapStartTime = now;
  localCar.checkpointsPassed = new Set();

  if (localCar.currentLap >= state.totalLaps) {
    localCar.finished = true;
    if (state.players[state.localId]) {
      state.players[state.localId].finished = true;
      state.players[state.localId].totalTime = localCar.totalTime;
    }
    broadcastToAll({ type: 'finished', id: state.localId, totalTime: localCar.totalTime });
    showNotification('🏁 FINISH!');
    setTimeout(() => checkRaceFinished(), 5000);
  } else {
    localCar.currentLap++;
    if (state.players[state.localId]) {
      state.players[state.localId].lap = localCar.currentLap;
    }
    broadcastToAll({ type: 'lapComplete', id: state.localId, lap: localCar.currentLap, totalTime: localCar.totalTime });
    showNotification(`LAP ${localCar.currentLap - 1} COMPLETE! Time: ${formatTime(elapsed)}`);
    updateLeaderboard();
  }
}

function checkRaceFinished() {
  const players = Object.values(state.players);
  const allDone = players.every(p => p.finished);
  const myDone = localCar.finished;
  if (myDone && (allDone || players.length <= 1)) {
    setTimeout(() => showFinishScreen(), 2000);
  } else if (myDone) {
    // Still wait for others
  }
}

function showFinishScreen() {
  stopGame();
  const players = Object.values(state.players).sort((a, b) => a.totalTime - b.totalTime);
  const podiumEl = document.getElementById('podium');
  const classes = ['p2', 'p1', 'p3'];
  const order = [players[1], players[0], players[2]].filter(Boolean);
  podiumEl.innerHTML = order.map((p, i) => {
    const pos = order === [players[1], players[0], players[2]] ? (i === 1 ? 1 : i === 0 ? 2 : 3) : i + 1;
    const actualPos = players.indexOf(p) + 1;
    return `
      <div class="podium-place p${actualPos}">
        <div class="podium-num">${actualPos}</div>
        <div style="width:12px;height:12px;border-radius:50%;background:${p.color};margin:0 auto 8px"></div>
        <div class="podium-name">${p.name}</div>
        <div class="podium-time">${formatTime(p.totalTime)}</div>
      </div>
    `;
  }).join('');
  showScreen('finishScreen');
}

function lineIntersects(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return false;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

let lastBroadcast = 0;
function broadcastCarUpdate() {
  const now = performance.now();
  if (now - lastBroadcast < 50) return; // 20 Hz
  lastBroadcast = now;
  broadcastToAll({
    type: 'carUpdate',
    id: state.localId,
    car: {
      x: localCar.x, y: localCar.y, angle: localCar.angle,
      speed: localCar.speed, lap: localCar.currentLap,
    },
  });
}

// ─── RENDERING ───────────────────────────────────────────────
function renderGame() {
  const W = gameCanvas.width, H = gameCanvas.height;
  const ctx = gameCtx;

  // Camera follows player
  const camX = localCar.x - W / 2;
  const camY = localCar.y - H / 2;

  ctx.save();
  ctx.translate(-camX, -camY);

  // Background
  ctx.fillStyle = currentMap.bgColor;
  ctx.fillRect(camX, camY, W, H);

  // Draw offroad texture
  drawOffroad(ctx, camX, camY, W, H);

  // Draw track
  drawTrack(ctx);

  // Start/finish line
  ctx.save();
  ctx.strokeStyle = currentMap.lineColor;
  ctx.lineWidth = 6;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(startLine.x1, startLine.y1);
  ctx.lineTo(startLine.x2, startLine.y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Remote cars
  Object.values(remoteCars).forEach(rc => {
    const p = Object.values(state.players).find(p => p.id && remoteCars[p.id] === rc);
    const carDef = CARS[rc.carIndex || 0];
    drawCarShape(ctx, rc.x, rc.y, rc.angle, carDef, rc.color);
    // Name tag
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(rc.x - 28, rc.y - 44, 56, 16);
    ctx.fillStyle = rc.color;
    ctx.font = 'bold 10px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(rc.name || 'P', rc.x, rc.y - 32);
  });

  // Local car
  const myCar = CARS[state.carIndex];
  const myColor = CAR_COLORS[state.carColor];

  // Tire marks when drifting
  if (Math.abs(localCar.steer) > 0.3 && Math.abs(localCar.speed) > 2) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.3, Math.abs(localCar.steer) * 0.3);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(localCar.x, localCar.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawCarShape(ctx, localCar.x, localCar.y, localCar.angle, myCar, myColor);

  // Speed boost particles if going fast
  if (Math.abs(localCar.speed) > 8) {
    drawSpeedParticles(ctx);
  }

  ctx.restore();

  // Minimap
  drawMinimap();
}

function drawOffroad(ctx, cx, cy, W, H) {
  ctx.save();
  ctx.fillStyle = currentMap.surfaceColor;
  ctx.fillRect(cx, cy, W, H);
  ctx.restore();
}

function drawTrack(ctx) {
  if (trackPolygon.length < 3) return;
  const W_track = 110; // track width

  // Outer track (grass border visible outside)
  ctx.save();

  // Draw the track surface with width by stroking
  ctx.beginPath();
  trackPolygon.forEach((pt, i) =>
    i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
  ctx.closePath();

  // Outer border
  ctx.strokeStyle = currentMap.borderColor;
  ctx.lineWidth = W_track + 16;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Main track surface
  ctx.strokeStyle = currentMap.trackColor;
  ctx.lineWidth = W_track;
  ctx.stroke();

  // Center dashed line
  ctx.strokeStyle = currentMap.lineColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.setLineDash([30, 25]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Edge lines
  ctx.strokeStyle = currentMap.lineColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6;
  const offsets = [W_track / 2 - 8, -(W_track / 2 - 8)];
  // We approximate edge lines by slightly thicker strokes (simplification)
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawSpeedParticles(ctx) {
  const backX = localCar.x - Math.sin(localCar.angle) * 30;
  const backY = localCar.y + Math.cos(localCar.angle) * 30;
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.globalAlpha = Math.random() * 0.3;
    ctx.fillStyle = currentMap.accentColor;
    ctx.beginPath();
    const px = backX + (Math.random() - 0.5) * 20;
    const py = backY + (Math.random() - 0.5) * 20;
    ctx.arc(px, py, Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMinimap() {
  const ctx = minimapCtx;
  const W = 160, H = 120;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(10,10,15,0.9)';
  ctx.fillRect(0, 0, W, H);

  const gW = gameCanvas.width, gH = gameCanvas.height;
  const sx = W / gW, sy = H / gH;

  // Track
  ctx.beginPath();
  trackPolygon.forEach((pt, i) =>
    i === 0 ? ctx.moveTo(pt.x * sx, pt.y * sy) : ctx.lineTo(pt.x * sx, pt.y * sy));
  ctx.closePath();
  ctx.strokeStyle = currentMap.trackColor;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = currentMap.borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Remote players
  Object.entries(remoteCars).forEach(([id, rc]) => {
    const p = Object.values(state.players).find(p => p.id === id);
    ctx.fillStyle = p ? p.color : '#aaa';
    ctx.beginPath();
    ctx.arc(rc.x * sx, rc.y * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Local player
  ctx.fillStyle = CAR_COLORS[state.carColor];
  ctx.beginPath();
  ctx.arc(localCar.x * sx, localCar.y * sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function updateHUD(now) {
  const speed = Math.abs(localCar.speed) * 30;
  document.getElementById('hudSpeed').textContent = Math.floor(speed);
  document.getElementById('hudCurrentLap').textContent = Math.min(localCar.currentLap, state.totalLaps);
  document.getElementById('hudTotalLaps').textContent = state.totalLaps;

  const elapsed = now - lapStartTime;
  document.getElementById('hudLapTime').textContent = formatTime(elapsed);

  // Position
  const players = Object.values(state.players);
  const sorted = players.sort((a, b) => {
    if (b.lap !== a.lap) return (b.lap || 1) - (a.lap || 1);
    return 0;
  });
  const pos = sorted.findIndex(p => p.id === state.localId) + 1;
  document.getElementById('hudPosition').textContent = pos || 1;

  updateLeaderboard();
}

function updateLeaderboard() {
  const el = document.getElementById('lbEntries');
  if (!el) return;
  const players = Object.values(state.players).map(p => ({
    ...p,
    currentLap: p.id === state.localId ? localCar.currentLap : (p.lap || 1),
  })).sort((a, b) => b.currentLap - a.currentLap);

  el.innerHTML = players.map((p, i) => `
    <div class="lb-entry">
      <span class="lb-pos ${i === 0 ? 'p1' : i === 1 ? 'p2' : i === 2 ? 'p3' : ''}">${i + 1}</span>
      <div class="lb-dot" style="background:${p.color}"></div>
      <span class="lb-name">${p.name}</span>
      <span class="lb-time">${formatTime(p.totalTime || 0)}</span>
    </div>
  `).join('');
}

function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms2 = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2,'0')}.${String(ms2).padStart(3,'0')}`;
}

// ─── COUNTDOWN ───────────────────────────────────────────────
function showCountdown(cb) {
  let count = 3;
  const overlay = document.createElement('div');
  overlay.className = 'countdown-overlay';
  document.body.appendChild(overlay);

  function tick() {
    overlay.innerHTML = `<div class="countdown-num">${count > 0 ? count : 'GO!'}</div>`;
    count--;
    if (count >= -1) {
      setTimeout(tick, 1000);
    } else {
      overlay.remove();
      cb();
    }
  }
  tick();
}

// ─── INIT ─────────────────────────────────────────────────────
(function init() {
  showScreen('menuScreen');
  // Pre-draw map previews in lobby when needed
})();
