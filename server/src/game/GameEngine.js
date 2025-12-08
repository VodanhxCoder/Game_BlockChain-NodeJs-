/**
 * GameEngine.js
 * 
 * Core game logic engine that runs on the backend.
 * Handles all game mechanics: invader movement, collision detection,
 * bullet physics, scoring, level progression, and blockades.
 */

class GameEngine {
  constructor(sessionId, username, level = 1, width = 1600, height = 900) {
    this.sessionId = sessionId;
    this.username = username;
    this.level = level;
    this.w = width;
    this.h = height;
    // Calculate scale factor based on reference width of 1600px
    this.scale = this.w / 1600;
    
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.paused = false;
    this.started = false;
    this.tick = 0;
    
    // Player state
    this.player = {
      x: this.w / 2,
      y: this.h - (40 * this.scale),
      w: 60 * this.scale,
      h: 15 * this.scale,
      speed: 5 * this.scale,
      reload: 0
    };

    // Game entities
    this.bullets = [];
    this.enemyBullets = [];
    this.invaders = [];
    this.droppedItems = [];
    this.blockades = [];

    // Invader configuration
    this.invaderW = 54 * this.scale;
    this.invaderH = 30 * this.scale;
    this.invaderPadding = 18 * this.scale;
    this.invaderOffsetY = 40 * this.scale;
    this.invaderDir = 1;
    this.invaderSpeed = (0.3 + level * 0.1) * this.scale;

    // Shooting mechanics
    this.lastShotTime = Date.now();
    this.shotCooldown = 300;
    this.lastEnemyShot = Date.now();
    this.enemyShotInterval = Math.max(700 - level * 60, 350);

    // Initialize level
    this.initLevel(level);
  }

  initLevel(lvl) {
    this.level = lvl;
    this.invaders = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.droppedItems = [];
    
    // Configure invaders based on level
    const cfg = this.getInvaderConfig(lvl);
    const pattern = this.generateInvaderPattern(cfg.rows, cfg.cols, lvl);
    
    for (let r = 0; r < cfg.rows; r++) {
      for (let c = 0; c < cfg.cols; c++) {
        if (!pattern[r][c]) continue;
        const x = c * (this.invaderW + this.invaderPadding) +
          (this.w - (cfg.cols * (this.invaderW + this.invaderPadding) - this.invaderPadding)) / 2;
        const y = r * (this.invaderH + (8 * this.scale)) + this.invaderOffsetY;
        this.invaders.push({ x, y, alive: true, row: r, col: c });
      }
    }

    this.invaderSpeed = cfg.speed * this.scale;
    this.blockades = this.generateBlockadesForLevel(lvl);
    this.enemyShotInterval = Math.max(700 - lvl * 60, 300);
  }

  getInvaderConfig(lvl) {
    if (lvl < 3) {
      const rows = Math.min(8, 3 + Math.floor((lvl - 1) / 2));
      const cols = Math.min(12, 8 + Math.floor((lvl - 1) / 2));
      const speed = 0.25 + lvl * 0.08;
      return { rows, cols, speed };
    }
    
    const rows = Math.min(10, 4 + (lvl - 3));
    const cols = Math.min(14, 8 + (lvl - 3));
    const speed = 0.25 + lvl * 0.09;
    return { rows, cols, speed };
  }

  generateInvaderPattern(rows, cols, lvl) {
    const pattern = Array.from({ length: rows }, () => Array(cols).fill(true));
    let mode = lvl >= 2 ? Math.floor(Math.random() * 4) : lvl % 4;
    const center = (cols - 1) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        switch (mode) {
          case 0:
            pattern[r][c] = true;
            break;
          case 1:
            if (r < Math.floor(rows / 3) && (c === 0 || c === cols - 1)) {
              pattern[r][c] = false;
            } else {
              pattern[r][c] = true;
            }
            break;
          case 2:
            pattern[r][c] = (r + c) % 2 === 0;
            break;
          case 3:
            const span = Math.max(0, Math.floor((r / Math.max(1, rows - 1)) * (cols / 2)));
            pattern[r][c] = Math.abs(c - center) <= span;
            break;
          default:
            pattern[r][c] = true;
        }
      }
    }
    return pattern;
  }

  generateBlockadesForLevel(lvl) {
    const blocks = [];
    if (lvl >= 5) return blocks;

    const clusterCount = 3;
    const cellW = 27 * this.scale;
    const cellH = 18 * this.scale;
    const cols = 5;
    const rows = 3;
    const clusterWidth = cols * cellW;
    const spacing = (this.w - clusterCount * clusterWidth) / (clusterCount + 1);
    const baseY = this.h - (140 * this.scale);

    const fullPattern = [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
    ];
    const reducedPattern = [
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ];
    const pattern = lvl <= 2 ? fullPattern : reducedPattern;

    for (let c = 0; c < clusterCount; c++) {
      const clusterX = spacing * (c + 1) + c * clusterWidth + (clusterWidth - cols * cellW) / 2;
      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          if (!pattern[r][cc]) continue;
          blocks.push({
            x: clusterX + cc * cellW,
            y: baseY + r * cellH,
            w: cellW - (3 * this.scale),
            h: cellH - (3 * this.scale),
            hp: 3,
          });
        }
      }
    }
    return blocks;
  }

  rectHit(x, y, w, h, rx, ry, rw, rh) {
    return x < rx + rw && x + w > rx && y < ry + rh && y + h > ry;
  }

  // Handle player movement
  movePlayer(direction) {
    if (this.gameOver || this.paused) return;
    
    if (direction === 'left') {
      this.player.x -= this.player.speed;
    } else if (direction === 'right') {
      this.player.x += this.player.speed;
    }
    
    this.player.x = Math.max(this.player.w / 2, Math.min(this.w - this.player.w / 2, this.player.x));
  }

  // Handle player shooting
  shoot() {
    if (this.gameOver || this.paused) return false;
    
    const now = Date.now();
    if (this.player.reload > 0) return false;
    if (now - this.lastShotTime < this.shotCooldown) return false;
    
    this.lastShotTime = now;
    this.player.reload = 12;
    this.bullets.push({ x: this.player.x, y: this.player.y - (20 * this.scale), speed: 6 * this.scale });
    return true;
  }

  // Main game update loop - returns events that occurred
  update() {
    if (this.gameOver || this.paused) return { events: [] };
    
    const events = [];
    
    // Decrease player reload
    if (this.player.reload > 0) this.player.reload--;

    // Update player bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y -= b.speed;
      
      if (b.y < -10) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with invaders
      for (const inv of this.invaders) {
        if (!inv.alive) continue;
        if (b.x > inv.x && b.x < inv.x + this.invaderW && 
            b.y > inv.y && b.y < inv.y + this.invaderH) {
          inv.alive = false;
          this.bullets.splice(i, 1);
          this.score += 10;
          
          events.push({
            type: 'enemy_killed',
            x: inv.x + this.invaderW / 2,
            y: inv.y + this.invaderH / 2,
            level: this.level
          });
          break;
        }
      }

      if (!this.bullets[i]) continue;

      // Check collision with blockades
      for (let bi = this.blockades.length - 1; bi >= 0; bi--) {
        const blk = this.blockades[bi];
        if (this.rectHit(b.x - (2 * this.scale), b.y - (8 * this.scale), 4 * this.scale, 8 * this.scale, blk.x, blk.y, blk.w, blk.h)) {
          blk.hp--;
          this.bullets.splice(i, 1);
          if (blk.hp <= 0) this.blockades.splice(bi, 1);
          break;
        }
      }
    }

    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.y += eb.speed;
      
      if (eb.y > this.h + 10) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (this.rectHit(eb.x - (2 * this.scale), eb.y - (6 * this.scale), 4 * this.scale, 8 * this.scale, 
          this.player.x - this.player.w / 2, this.player.y - (12 * this.scale), this.player.w, this.player.h + (12 * this.scale))) {
        this.enemyBullets.splice(i, 1);
        this.lives--;
        
        events.push({ type: 'player_hit' });
        
        if (this.lives <= 0) {
          this.gameOver = true;
          events.push({ type: 'game_over', score: this.score });
        } else {
          this.player.x = this.w / 2;
        }
        continue;
      }

      // Check collision with blockades
      for (let bi = this.blockades.length - 1; bi >= 0; bi--) {
        const blk = this.blockades[bi];
        if (this.rectHit(eb.x - (2 * this.scale), eb.y - (6 * this.scale), 4 * this.scale, 8 * this.scale, blk.x, blk.y, blk.w, blk.h)) {
          blk.hp--;
          this.enemyBullets.splice(i, 1);
          if (blk.hp <= 0) this.blockades.splice(bi, 1);
          break;
        }
      }
    }

    // Update invader movement
    let hitSide = false;
    const margin = 6 * this.scale;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      inv.x += this.invaderDir * this.invaderSpeed;
      if (inv.x < margin || inv.x + this.invaderW > this.w - margin) hitSide = true;
    }
    
    if (hitSide) {
      this.invaderDir *= -1;
      for (const inv of this.invaders) {
        inv.y += 12 * this.scale;
      }
    }

    // Check if invaders reached player
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      if (inv.y + this.invaderH >= this.player.y) {
        this.gameOver = true;
        events.push({ type: 'game_over', score: this.score });
        break;
      }
    }

    // Enemy shooting
    const now = Date.now();
    if (now - this.lastEnemyShot > this.enemyShotInterval && this.invaders.some(i => i.alive)) {
      const byCol = {};
      for (const inv of this.invaders) {
        if (!inv.alive) continue;
        const col = inv.col;
        if (!byCol[col] || inv.y > byCol[col].y) byCol[col] = inv;
      }
      const cols = Object.keys(byCol);
      const shooter = byCol[cols[Math.floor(Math.random() * cols.length)]];
      if (shooter) {
        this.enemyBullets.push({
          x: shooter.x + this.invaderW / 2,
          y: shooter.y + this.invaderH + (6 * this.scale),
          speed: (3 + this.level * 0.2) * this.scale,
        });
      }
      this.lastEnemyShot = now;
      this.enemyShotInterval = Math.max(300, 600 + Math.random() * 500 - this.level * 40);
    }

    // Update falling items
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      if (item.collected) continue;

      item.velocityY = Math.min((item.velocityY || 0) + (item.gravity || 0.06 * this.scale), item.maxFallSpeed || 2 * this.scale);
      item.y += item.velocityY;

      // Check collision with player
      const playerLeft = this.player.x - this.player.w / 2;
      const playerRight = this.player.x + this.player.w / 2;
      const playerTop = this.player.y - (12 * this.scale);
      const playerBottom = this.player.y + (10 * this.scale);

      const itemLeft = item.x - item.size / 2;
      const itemRight = item.x + item.size / 2;
      const itemTop = item.y - item.size / 2;
      const itemBottom = item.y + item.size / 2;

      if (itemLeft < playerRight && itemRight > playerLeft &&
          itemTop < playerBottom && itemBottom > playerTop) {
        item.collected = true;
        events.push({ type: 'item_collected', item });
        this.droppedItems.splice(i, 1);
        continue;
      }

      // Remove items that fall off screen
      if (item.y > this.h + 50) {
        this.droppedItems.splice(i, 1);
      }
    }

    // Check for level completion
    if (!this.invaders.some(i => i.alive)) {
      const nextLevel = Math.min(10, this.level + 1);
      this.initLevel(nextLevel);
      events.push({ type: 'level_complete', level: this.level });
    }

    this.tick++;
    return { events, state: this.getState() };
  }

  // Add dropped item to game
  addDroppedItem(item) {
    this.droppedItems.push({
      ...item,
      velocityY: 0,
      gravity: 0.06 * this.scale,
      maxFallSpeed: 2 * this.scale,
      collected: false,
      size: 28 * this.scale,
    });
  }

  // Get current game state for rendering
  getState() {
    return {
      sessionId: this.sessionId,
      player: this.player,
      bullets: this.bullets,
      enemyBullets: this.enemyBullets,
      invaders: this.invaders.filter(i => i.alive),
      droppedItems: this.droppedItems,
      blockades: this.blockades,
      score: this.score,
      lives: this.lives,
      level: this.level,
      gameOver: this.gameOver,
      paused: this.paused,
      started: this.started,
      tick: this.tick,
      // Include rendering constants
      w: this.w,
      h: this.h,
      invaderW: this.invaderW,
      invaderH: this.invaderH,
    };
  }

  start() {
    this.started = true;
    this.paused = false;
  }

  pause() {
    this.paused = !this.paused;
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.paused = false;
    this.started = false;
    this.initLevel(1);
  }
}

export default GameEngine;
