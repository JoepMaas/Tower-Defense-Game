# 🏰 Tower Defense Game

A browser-based tower defense game built with vanilla JavaScript and HTML5 Canvas. Place towers, survive waves of enemies, defeat bosses, and protect your base across multiple maps and difficulty modes.

---

## 🎮 Features

- 7 unique tower types with upgrades and sell system
- 4 enemy types plus bosses and a final boss
- 4 maps with different layouts
- 3 game modes: Normal, Hard, and Endless
- Pause, fast-forward, and hotkey support
- Particle effects, boss health bar, wave banners

---

## 🗺️ Maps

| Map | Description |
|--------|-------------|
| **Classic** | Simple L-shaped path, good for beginners |
| **Snake** | Long winding path, more time to deal damage |
| **Cross** | Intersecting path with tight corners |
| **Spiral** | Complex multi-turn path, hardest to cover |

---

## 🏗️ Towers

| # | Tower | Cost | Damage | Range | Fire Rate | Special |
|---|-------|------|--------|-------|-----------|---------|
| 1 | Basic | $100 | 10 | 140 | Medium | Balanced all-rounder |
| 2 | Rapid | $150 | 5 | 110 | Fast | High DPS, short range |
| 3 | Sniper | $250 | 40 | 260 | Slow | Long range, high damage |
| 4 | Splash | $300 | 35 | 150 | Medium | Area damage |
| 5 | Freeze | $275 | 8 | 170 | Medium | Slows enemies by 75% |
| 6 | Poison | $350 | 12 | 180 | Medium | Applies damage over time |
| 7 | Laser | $500 | 8 | 220 | Very Fast | Continuous high DPS |

### Upgrading & Selling
- **Right-click** a tower to open the upgrade menu
- Each upgrade increases damage, range, and fire rate
- Upgrade cost = `$100 × current level`
- Selling returns **75%** of total gold spent on that tower

---

## 👾 Enemies

| Type | Description |
|------|-------------|
| **Normal** | Standard enemy, balanced stats |
| **Fast** | 1.8× speed, 0.6× HP — hard to hit |
| **Tank** | 0.6× speed, 4× HP, larger radius |
| **Regen** | Regenerates HP over time |
| **Splitter** | Splits into 2 smaller enemies on death |
| **Boss** | Spawns every 5 waves, high HP, drops $300 |
| **Final Boss** | Last wave boss, 5× normal boss HP |

---

## 🎯 Game Modes

| Mode | Starting Gold | Starting HP | Waves | Notes |
|------|--------------|-------------|-------|-------|
| **Normal** | $300 | 100 | 20 | Recommended for new players |
| **Hard** | $200 | 75 | 30 | More enemies, higher HP and speed |
| **Endless** | $300 | 100 | ∞ | No victory condition, survive as long as possible |

---

## ⌨️ Hotkeys

| Key | Action |
|-----|--------|
| `1` | Select Basic tower |
| `2` | Select Rapid tower |
| `3` | Select Sniper tower |
| `4` | Select Splash tower |
| `5` | Select Freeze tower |
| `6` | Select Poison tower |
| `7` | Select Laser tower |
| `U` | Upgrade selected tower |
| `X` | Sell selected tower |
| `Space` | Pause / Resume |
| `F` | Toggle fast forward (2×) |
| `ESC` | Close upgrade menu |

---

## 🚀 How to Run

No build tools or dependencies required.

1. Clone or download the project
2. Open `index.html` in any modern browser
3. Select a game mode and map, then start placing towers

```
project/
├── index.html
├── style.css
└── game.js
```

---

## 🛠️ Tech Stack

- **HTML5 Canvas** — rendering
- **Vanilla JavaScript** — all game logic
- **CSS** — UI styling

No frameworks, no libraries, no build step.

---

## 💡 Tips

- Cover path **bends** with splash or freeze towers — enemies slow down there naturally
- Use **Sniper** towers on long straight sections for maximum value
- **Freeze + Poison** combo is very effective against tanks and bosses
- Sell and reposition towers between waves if your setup isn't working
- In **Endless** mode, prioritize upgrading existing towers over buying new ones