/**
 * gameEngine.js
 * Circle Survivor Game Logic
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.scoreElement = document.getElementById("time-score");

    // Set canvas size
    this.canvas.width = 1200;
    this.canvas.height = 1200;

    this.leaderboardList = document.getElementById("leaderboard-list");
    this.loadLeaderboard();

    // Audio
    this.audio = new AudioManager();
    this.audio.init();

    // UI Elements for Game Over
    this.overlay = document.getElementById("game-over-overlay");
    this.reviveSection = document.getElementById("revive-section");
    this.nameSection = document.getElementById("name-section");
    this.finalScoreElement = document.getElementById("final-score");
    this.playerNameInput = document.getElementById("player-name");
    this.submitBtn = document.getElementById("submit-score-btn");

    if (this.submitBtn) {
      this.submitBtn.onclick = () => {
        const name = this.playerNameInput.value.trim();
        if (name) {
          this.saveScore(name, this.score);
          this.overlay.classList.add("hidden");
        } else {
          alert("Please enter your name!");
        }
      };
    }

    // Store & Items
    this.storeModal = document.getElementById("store-modal");
    this.storeCoinsElement = document.getElementById("store-coins");
    this.modalCoinsElement = document.getElementById("modal-coins");
    this.activeItemsPanel = document.getElementById("active-items");

    this.coins = parseInt(localStorage.getItem("circleSurvivorCoins") || "0");
    const defaultInventory = {
      shield: 0, potion: 0, timer: 0, shrink: 0,
      turbo: 0, bomb: 0, ghost: 0, magnet: 0,
      double: 0, clover: 0, decoy: 0
    };
    this.inventory = { ...defaultInventory, ...JSON.parse(localStorage.getItem("circleSurvivorInventory") || "{}") };

    // Buff Timers (in seconds)
    this.buffs = {
      timer: 0, shrink: 0, turbo: 0,
      magnet: 0, double: 0, ghost: 0,
      decoy: 0, decoyX: 0, decoyY: 0
    };

    this.updateStoreUI();

    // Load Player Image
    this.playerImage = new Image();
    this.playerImage.src = "./assets/images/player.png";
    this.isPlayerImageLoaded = false;
    this.playerImage.onload = () => {
      this.isPlayerImageLoaded = true;
    };

    this.reset();
  }

  updateStoreUI() {
    if (this.storeCoinsElement) this.storeCoinsElement.innerText = this.coins;
    if (this.modalCoinsElement) this.modalCoinsElement.innerText = this.coins;
    localStorage.setItem("circleSurvivorCoins", this.coins);
    localStorage.setItem("circleSurvivorInventory", JSON.stringify(this.inventory));
    this.updateActiveItemsUI();
  }

  updateActiveItemsUI() {
    if (!this.activeItemsPanel) return;
    this.activeItemsPanel.innerHTML = "";
    const items = [
      { id: 'shield', label: '🛡️ Shield', key: 'E', color: '#00ffff' },
      { id: 'timer', label: '⏳ Slower', key: 'Q', color: '#00ff00' },
      { id: 'shrink', label: '🤏 Shrink', key: 'R', color: '#ff8800' },
      { id: 'turbo', label: '🚀 Turbo', key: 'Shift', color: '#66ccff' },
      { id: 'bomb', label: '💣 Bomb', key: 'F', color: '#ff3333' },
      { id: 'ghost', label: '👻 Ghost', key: 'G', color: '#ffffff' },
      { id: 'magnet', label: '🧲 Magnet', key: 'M', color: '#ffd700' },
      { id: 'double', label: '💰 x2 Coin', key: 'V', color: '#ffff00' },
      { id: 'decoy', label: '🤡 Decoy', key: 'X', color: '#ffaa00' }
    ];

    items.forEach(item => {
      if (this.inventory[item.id] > 0) {
        let text = `${item.label}: ${this.inventory[item.id]}`;
        if (item.id === 'potion') text = `🧪 Revive: ${this.inventory.potion}`;
        this.activeItemsPanel.innerHTML += `<div class="item-indicator" style="border-color: ${item.color}; color: ${item.color}; box-shadow: 0 0 10px ${item.color};">${text}</div>`;
      }
    });

    if (this.inventory.potion > 0) {
      this.activeItemsPanel.innerHTML += `<div class="item-indicator" style="border-color: #ff00ff; color: #ff00ff; box-shadow: 0 0 10px #ff00ff;">🧪 Revive: ${this.inventory.potion} (Auto)</div>`;
    }
  }

  toggleStore(show) {
    if (this.storeModal) this.storeModal.classList.toggle("hidden", !show);
  }

  buyItem(type) {
    const prices = {
      shield: 20, potion: 40, timer: 30, shrink: 25,
      turbo: 20, bomb: 50, ghost: 45, magnet: 35,
      double: 40, clover: 60, decoy: 35
    };
    if (this.coins >= prices[type]) {
      this.coins -= prices[type];
      this.inventory[type]++;
      this.updateStoreUI();
      this.audio.playPurchase();
      alert("Purchase successful!");
    } else {
      this.audio.playNoMoney();
      alert("No money!");
    }
  }

  toggleMute() {
    const isMuted = this.audio.toggleMute();
    const muteBtn = document.getElementById("muteBtn");
    if (muteBtn) {
      muteBtn.innerText = isMuted ? "🔇 Muted" : "🔊 Sound On";
    }
  }

  loadLeaderboard() {
    const stored = localStorage.getItem("circleSurvivorLeaderboard");
    this.scores = stored ? JSON.parse(stored) : [];
    this.updateLeaderboardUI();
  }

  saveScore(name, score) {
    this.scores.push({ name, score });
    this.scores.sort((a, b) => b.score - a.score); // Descending
    this.scores = this.scores.slice(0, 5); // Keep top 5
    localStorage.setItem("circleSurvivorLeaderboard", JSON.stringify(this.scores));
    this.updateLeaderboardUI();
  }

  updateLeaderboardUI() {
    if (!this.leaderboardList) return;
    this.leaderboardList.innerHTML = "";
    if (this.scores.length === 0) {
      this.leaderboardList.innerHTML = "<li>No scores yet</li>";
      return;
    }

    this.scores.forEach((entry, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${index + 1}. ${entry.name}</span> <span class="score">${entry.score.toFixed(1)}s</span>`;
      this.leaderboardList.appendChild(li);
    });
  }

  reset() {
    this.isPlaying = false;
    this.score = 0;
    if (this.scoreElement) this.scoreElement.innerText = "0.0";
    this.enemies = [];
    this.collectables = [];
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.spawnInterval = 1.0;

    // Shield State
    this.isShieldActive = false;
    this.shieldTime = 0;

    // Player
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 15,
      speed: 250,
      color: "#00ffff"
    };

    // Use shield if possible - Replaced with manual trigger below
    // if (this.inventory.shield > 0) {
    //   this.useShield();
    // }

    // Input
    this.input = {
      w: false, a: false, s: false, d: false,
      e: false, q: false, r: false, shift: false,
      f: false, g: false, m: false, v: false, x: false
    };
  }

  useShield() {
    this.inventory.shield--;
    this.isShieldActive = true;
    this.shieldTime = 5.0;
    this.updateStoreUI();
  }

  // ... (start, stop, handleInput, update methods remain same) ...

  gameOver() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.audio.playDeath();
    this.audio.stopBGM();

    // UI Updates
    const stopBtn = document.getElementById("stopBtn");
    if (stopBtn) stopBtn.disabled = true;
    const startBtn = document.getElementById("startBtn");
    if (startBtn) startBtn.disabled = false;

    // Orchestrate Sections
    if (this.overlay) {
      this.overlay.classList.remove("hidden");

      if (this.inventory.potion > 0) {
        // Show Revive Section
        if (this.reviveSection) this.reviveSection.classList.remove("hidden");
        if (this.nameSection) this.nameSection.classList.add("hidden");
      } else {
        // Show Name Section directly
        this.showNameEntry();
      }
    }
  }

  showNameEntry() {
    if (this.reviveSection) this.reviveSection.classList.add("hidden");
    if (this.nameSection) {
      if (this.finalScoreElement) this.finalScoreElement.innerText = this.score.toFixed(1);
      if (this.playerNameInput) this.playerNameInput.value = "";
      this.nameSection.classList.remove("hidden");
    }
  }

  confirmRevive(choice) {
    if (choice && this.inventory.potion > 0) {
      this.audio.playRevive();
      this.audio.startBGM();
      this.inventory.potion--;
      this.updateStoreUI();
      this.isShieldActive = true;
      this.shieldTime = 3.0; // Invincible brief
      this.enemies = []; // Clear current enemies
      this.isPlaying = true;
      if (this.overlay) this.overlay.classList.add("hidden");

      // Re-enable Finish button
      const stopBtn = document.getElementById("stopBtn");
      if (stopBtn) stopBtn.disabled = false;
      const startBtn = document.getElementById("startBtn");
      if (startBtn) startBtn.disabled = true;
    } else {
      this.showNameEntry();
    }
  }

  // ... (draw method remains same) ...

  start() {
    this.reset();
    this.isPlaying = true;
    this.audio.init(); // Ensure ctx is ready
    this.audio.startBGM();
    if (this.overlay) this.overlay.classList.add("hidden");
    if (this.storeModal) this.storeModal.classList.add("hidden");
  }

  stop() {
    this.isPlaying = false;
  }

  handleInput(key, isPressed) {
    const k = key.toLowerCase();
    if (this.input.hasOwnProperty(k)) {
      this.input[k] = isPressed;
    }
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    // 1. Update Score
    this.score += deltaTime;
    if (this.scoreElement) this.scoreElement.innerText = this.score.toFixed(1);

    // 2. Player Movement
    let dx = 0;
    let dy = 0;
    if (this.input.w) dy -= 1;
    if (this.input.s) dy += 1;
    if (this.input.a) dx -= 1;
    if (this.input.d) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    // Normal Movement Speed
    let currentSpeed = this.player.speed;
    if (this.buffs.turbo > 0) currentSpeed *= 1.4;

    this.player.x += dx * currentSpeed * deltaTime;
    this.player.y += dy * currentSpeed * deltaTime;

    // Handle Active Items (Hotkeys)
    this.handleActiveItems();

    // Player Size (Shrink)
    this.player.radius = this.buffs.shrink > 0 ? 8 : 15;

    // Boundary Check
    this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));

    // 3. Enemy Spawning
    this.coinTimer += deltaTime;
    let coinInterval = 1.5;
    if (this.inventory.clover > 0) coinInterval /= 1.3; // 30% faster coins

    if (this.coinTimer >= coinInterval) {
      this.spawnCoin();
      this.coinTimer = 0;
    }

    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnEnemy();
      this.spawnTimer = 0;
      if (this.spawnInterval > 0.3) this.spawnInterval -= 0.005; // Slightly slower difficulty curve
    }

    // 4. Enemy Movement & Collision
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.x += enemy.vx * deltaTime;
      enemy.y += enemy.vy * deltaTime;

      // Remove off-screen enemies (with buffer)
      if (
        enemy.x < -50 ||
        enemy.x > this.canvas.width + 50 ||
        enemy.y < -50 ||
        enemy.y > this.canvas.height + 50
      ) {
        this.enemies.splice(i, 1);
        continue;
      }

      // Collision Check (Circle-Circle)
      const dist = Math.sqrt(
        (this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2
      );
      if (dist < this.player.radius + enemy.radius) {
        if (!this.isShieldActive && this.buffs.ghost <= 0) {
          this.gameOver();
        }
      }
    }

    // 5. Coin Interaction
    for (let i = this.collectables.length - 1; i >= 0; i--) {
      const coin = this.collectables[i];

      // Magnet Effect
      if (this.buffs.magnet > 0) {
        const dX = this.player.x - coin.x;
        const dY = this.player.y - coin.y;
        const dist = Math.sqrt(dX * dX + dY * dY);
        if (dist < 150) {
          coin.x += (dX / dist) * 200 * deltaTime;
          coin.y += (dY / dist) * 200 * deltaTime;
        }
      }

      const dist = Math.sqrt((this.player.x - coin.x) ** 2 + (this.player.y - coin.y) ** 2);
      if (dist < this.player.radius + coin.radius) {
        let val = 10;
        if (this.buffs.double > 0) val = 20;
        this.coins += val;
        this.audio.playCoin();
        this.updateStoreUI();
        this.collectables.splice(i, 1);
        continue;
      }
      coin.life -= deltaTime;
      if (coin.life <= 0) this.collectables.splice(i, 1);
    }

    // 6. Buff Updates
    this.updateBuffs(deltaTime);
  }

  handleActiveItems() {
    // Each key press consumes item and starts buff
    if (this.input.e && this.inventory.shield > 0 && !this.isShieldActive) this.useShield();
    if (this.input.q && this.inventory.timer > 0 && this.buffs.timer <= 0) this.useItem('timer', 8);
    if (this.input.r && this.inventory.shrink > 0 && this.buffs.shrink <= 0) this.useItem('shrink', 10);
    if (this.input.shift && this.inventory.turbo > 0 && this.buffs.turbo <= 0) this.useItem('turbo', 10);
    if (this.input.f && this.inventory.bomb > 0) this.useFlashBomb();
    if (this.input.g && this.inventory.ghost > 0 && this.buffs.ghost <= 0) this.useItem('ghost', 3);
    if (this.input.m && this.inventory.magnet > 0 && this.buffs.magnet <= 0) this.useItem('magnet', 15);
    if (this.input.v && this.inventory.double > 0 && this.buffs.double <= 0) this.useItem('double', 20);
    if (this.input.x && this.inventory.decoy > 0 && this.buffs.decoy <= 0) this.useDecoy();
  }

  useItem(type, duration) {
    this.inventory[type]--;
    this.buffs[type] = duration;
    this.audio.playActivation();
    this.updateStoreUI();
  }

  useFlashBomb() {
    this.inventory.bomb--;
    this.enemies = [];
    this.audio.playActivation();
    this.updateStoreUI();
  }

  useDecoy() {
    this.inventory.decoy--;
    this.buffs.decoy = 5;
    this.buffs.decoyX = this.player.x;
    this.buffs.decoyY = this.player.y;
    this.audio.playActivation();
    this.updateStoreUI();
  }

  updateBuffs(deltaTime) {
    for (let key in this.buffs) {
      if (key.includes('X') || key.includes('Y')) continue;
      if (this.buffs[key] > 0) {
        this.buffs[key] -= deltaTime;
        if (this.buffs[key] <= 0) this.buffs[key] = 0;
      }
    }

    // Shield is special state but integrated logic
    if (this.isShieldActive) {
      this.shieldTime -= deltaTime;
      if (this.shieldTime <= 0) this.isShieldActive = false;
    }
  }

  spawnCoin() {
    this.collectables.push({
      x: 100 + Math.random() * (this.canvas.width - 200),
      y: 100 + Math.random() * (this.canvas.height - 200),
      radius: 12,
      life: 5.0
    });
  }

  spawnEnemy() {
    const radius = 10 + Math.random() * 10;
    let x, y;

    // Spawn at edge
    const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    switch (side) {
      case 0: x = Math.random() * this.canvas.width; y = -radius; break;
      case 1: x = this.canvas.width + radius; y = Math.random() * this.canvas.height; break;
      case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + radius; break;
      case 3: x = -radius; y = Math.random() * this.canvas.height; break;
    }

    // Target
    let targetX = this.player.x;
    let targetY = this.player.y;
    if (this.buffs.decoy > 0) {
      targetX = this.buffs.decoyX;
      targetY = this.buffs.decoyY;
    }

    const angle = Math.atan2(targetY - y, targetX - x);
    let speed = 150 + Math.random() * 100 + (this.score * 5);
    if (this.buffs.timer > 0) speed *= 0.5;

    this.enemies.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: radius,
      color: "#ff3333"
    });
  }


  draw() {
    // Clear Canvas
    this.ctx.fillStyle = "#222";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Player
    // Draw Shield Bubble
    if (this.isShieldActive) {
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, this.player.y, this.player.radius * 1.8, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#00ffff";
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
      this.ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
      this.ctx.fill();
    }

    if (this.isPlayerImageLoaded) {
      // Draw image centered on player position
      const drawSize = this.player.radius * 3.5; // Scale image slightly larger than collision radius
      this.ctx.drawImage(
        this.playerImage,
        this.player.x - drawSize / 2,
        this.player.y - drawSize / 2,
        drawSize,
        drawSize
      );
    } else {
      // Ghost Effect Visual
      if (this.buffs.ghost > 0) this.ctx.globalAlpha = 0.5;

      // Fallback to circle
      this.ctx.beginPath();
      this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.player.color;
      this.ctx.fill();
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.closePath();

      this.ctx.globalAlpha = 1.0;
    }

    // Draw Decoy
    if (this.buffs.decoy > 0) {
      this.ctx.beginPath();
      this.ctx.arc(this.buffs.decoyX, this.buffs.decoyY, 15, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(255, 170, 0, 0.6)";
      this.ctx.fill();
      this.ctx.strokeStyle = "white";
      this.ctx.stroke();
      this.ctx.closePath();
    }

    // Draw Coins
    for (const coin of this.collectables) {
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ffd700";
      this.ctx.fill();
      this.ctx.strokeStyle = "white";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.fillStyle = "black";
      this.ctx.font = "bold 14px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("$", coin.x, coin.y + 5);
      this.ctx.closePath();
    }

    // Draw Enemies
    for (const enemy of this.enemies) {
      this.ctx.beginPath();
      // Draw as Triangle for "Villain" look? Or just Circle for now as per plan? 
      // Plan said "Red shapes". Let's do Circles for simplicity of collision, 
      // but maybe draw a triangle visually if requested. 
      // User said "Red Triangle (Villain)".
      // Let's draw visual triangle but use circle collision for simplicity.

      this.ctx.fillStyle = enemy.color;

      // Visual Triangle
      this.ctx.moveTo(enemy.x + enemy.radius, enemy.y);
      this.ctx.lineTo(enemy.x - enemy.radius / 2, enemy.y + enemy.radius);
      this.ctx.lineTo(enemy.x - enemy.radius / 2, enemy.y - enemy.radius);
      this.ctx.fill();

      // Debug collision circle (optional, commented out)
      // this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI*2);
      // this.ctx.stroke();
    }
  }
}

window.GameEngine = GameEngine;
