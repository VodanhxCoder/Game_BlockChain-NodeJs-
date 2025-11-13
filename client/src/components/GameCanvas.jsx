import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Fetch loot from backend - uses drop_pool table exclusively
async function fetchLootFromBackend(level, username) {
  try {
    console.log(`🎲 Requesting drop for user: ${username}, level: ${level}`);
    const response = await axios.post("/api/drop", { level, username });
    console.log("📦 Backend response:", response.data);
    
    if (response.data && response.data.dropped) {
      // Transform backend response to match expected format and include hash
      const item = response.data.item || {};
      console.log("✅ Item dropped:", item.itemName || item.name || response.data);
      return {
        itemId: item.itemId || item.id,
        // keep backwards-compatible 'name' keys for older UI code and add canonical keys
        name: item.itemName || item.name,
        itemName: item.itemName || item.name,
        rarity: item.itemTier || item.rarity,
        itemTier: item.itemTier || item.rarity,
        itemImage: item.itemImage || item.image,
        itemHash: response.data.itemHash || item.itemHash || item.hash || null,
        quantity: item.quantity || 1,
        id: response.data.userItemId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        level,
        timestamp: response.data.timestamp || new Date().toISOString(),
        timeLabel: new Date(response.data.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dropped: true,
      };
    }
    console.log("❌ No drop this time");
    return null;
  } catch (error) {
    console.error("❌ Failed to fetch loot from backend:", error);
    console.error("Error details:", error.response?.data || error.message);
    return null;
  }
}

function generateBlockadesForLevel(lvl, g) {
  const blocks = [];
  if (lvl >= 5) return blocks;

  const clusterCount = 3;
  const cellW = 27;
  const cellH = 18;
  const cols = 5;
  const rows = 3;
  const clusterWidth = cols * cellW;
  const spacing = (g.w - clusterCount * clusterWidth) / (clusterCount + 1);
  const baseY = g.h - 140;

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
          w: cellW - 3,
          h: cellH - 3,
          hp: 3,
        });
      }
    }
  }
  return blocks;
}

// Return invader configuration (rows, cols, base speed) for a given level.
function getInvaderConfig(lvl) {
  // Keep gentle growth for early levels, but from level 3 onward
  // increase enemy counts more aggressively to ramp difficulty.
  if (lvl < 3) {
    // rows grow slowly with level, cols also increase; cap to keep layout reasonable
    const rows = Math.min(8, 3 + Math.floor((lvl - 1) / 2));
    const cols = Math.min(12, 8 + Math.floor((lvl - 1) / 2));
    // base speed increases with level but in a controlled way
    const speed = 0.25 + lvl * 0.08;
    return { rows, cols, speed };
  }

  // Level 3+ will add more rows/cols to increase challenge.
  // We cap to avoid layout overflow but make levels feel more packed.
  const rows = Math.min(10, 4 + (lvl - 3));
  const cols = Math.min(14, 8 + (lvl - 3));
  const speed = 0.25 + lvl * 0.09;
  return { rows, cols, speed };
}

// Generate a boolean pattern matrix [rows][cols] that controls which invader slots are occupied.
// We vary patterns by level to produce more interesting formations.
function generateInvaderPattern(rows, cols, lvl) {
  const pattern = Array.from({ length: rows }, () => Array(cols).fill(true));

  // For level 2 and onwards we pick a random formation mode so games feel varied.
  // For level 1 keep deterministic behavior (based on level) so tutorial feels stable.
  let mode;
  if (lvl >= 2) {
    mode = Math.floor(Math.random() * 4); // 0..3 random
  } else {
    mode = lvl % 4;
  }
  const center = (cols - 1) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      switch (mode) {
        case 0:
          // Full block on easy/standard levels
          pattern[r][c] = true;
          break;
        case 1:
          // Reduced edges: leave outermost columns empty on top rows
          if (r < Math.floor(rows / 3) && (c === 0 || c === cols - 1)) pattern[r][c] = false;
          else pattern[r][c] = true;
          break;
        case 2:
          // Checkerboard for mid difficulty
          pattern[r][c] = (r + c) % 2 === 0;
          break;
        case 3:
          // Centered V / mountain shape that widens toward the bottom
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

const GameCanvas = ({ onLootDrop, onScoreChange, onLivesChange, onLevelChange, onKillsChange }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const keys = useRef({});
  const state = useRef({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);
  const killCountRef = useRef(0);
  const { user } = useAuth();

  const syncKills = (value) => {
    killCountRef.current = value;
    if (onKillsChange) onKillsChange(value);
  };

  const incrementKills = () => {
    syncKills(killCountRef.current + 1);
  };

  const resetKills = () => {
    syncKills(0);
  };

  // Callback helpers to notify parent of state changes
  const updateScore = (newScore) => {
    setScore(newScore);
    if (onScoreChange) onScoreChange(newScore);
  };

  const updateLives = (nextValue) => {
    setLives((prev) => {
      const resolved = typeof nextValue === "function" ? nextValue(prev) : nextValue;
      if (resolved < prev) {
        resetKills();
      }
      if (onLivesChange) onLivesChange(resolved);
      return resolved;
    });
  };

  const updateLevel = (newLevel) => {
    setLevel(newLevel);
    if (onLevelChange) onLevelChange(newLevel);
  };

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const rectHit = (x, y, w, h, rx, ry, rw, rh) => {
    return x < rx + rw && x + w > rx && y < ry + rh && y + h > ry;
  };

  const tryShoot = () => {
    const s = state.current;
    const now = Date.now();
    if (!s || s.player.reload > 0) return;
    if (now - s.lastShotTime < s.shotCooldown) return;
    s.lastShotTime = now;
    s.player.reload = 12;
    s.bullets.push({ x: s.player.x, y: s.player.y - 20, speed: 6 });
  };

  const initGame = (lvl = 1) => {
    const w = 1600;
    const h = 900;
    state.current = {
      w,
      h,
      player: { x: w / 2, y: h - 40, w: 60, h: 15, speed: 5, reload: 0 },
      bullets: [],
      enemyBullets: [],
      invaders: [],
      droppedItems: [], // Falling items from defeated enemies
      invaderRows: 4,
      invaderCols: 8,
      invaderW: 54,
      invaderH: 30,
      invaderPadding: 18,
      invaderOffsetY: 40,
      invaderDir: 1,
      invaderSpeed: 0.3 + lvl * 0.1,
      lastShotTime: 0,
      shotCooldown: 300,
      tick: 0,
      gameOver: false,
      level: lvl,
      lastEnemyShot: Date.now(),
      enemyShotInterval: Math.max(700 - lvl * 60, 350),
      blockades: [],
      started: false,
    };

    setGameOver(false);

    const s = state.current;
    // configure invaders based on level
    const cfg = getInvaderConfig(lvl);
    s.invaderRows = cfg.rows;
    s.invaderCols = cfg.cols;
    s.invaderSpeed = cfg.speed;
    const pattern = generateInvaderPattern(s.invaderRows, s.invaderCols, lvl);
    for (let r = 0; r < s.invaderRows; r++) {
      for (let c = 0; c < s.invaderCols; c++) {
        if (!pattern[r][c]) continue;
        const x =
          c * (s.invaderW + s.invaderPadding) +
          (s.w - (s.invaderCols * (s.invaderW + s.invaderPadding) - s.invaderPadding)) / 2;
        const y = r * (s.invaderH + 8) + s.invaderOffsetY;
        s.invaders.push({ x, y, alive: true, row: r, col: c });
      }
    }

    s.blockades = generateBlockadesForLevel(lvl, s);

    updateScore(0);
    updateLives(3);
    updateLevel(lvl);
    resetKills();
  };

  useEffect(() => {
    initGame(level);

    const onKeyDown = (e) => {
      keys.current[e.code] = true;
      if (e.code === "Space") {
        e.preventDefault();
        if (state.current && state.current.gameOver) {
          initGame(1);
          state.current.started = true;
          updateLevel(1);
          updateScore(0);
          updateLives(3);
          setGameOver(false);
          setRunning(true);
          keys.current["Space"] = false;
          return;
        }

        if (state.current && !state.current.started) {
          state.current.started = true;
          setRunning(true);
          return;
        }

        if (state.current && state.current.started && !runningRef.current) {
          setRunning(true);
          keys.current["Space"] = false;
          return;
        }
      }
      if (e.code === "KeyP") {
        e.preventDefault();
        if (state.current.started) setRunning((r) => !r);
      }
    };
    const onKeyUp = (e) => (keys.current[e.code] = false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      const c = canvasRef.current;
      const s = state.current;
      if (c && s) {
        if (fs) {
          // enlarge logical resolution to current window size when entering fullscreen
          s.w = window.innerWidth;
          s.h = window.innerHeight;
          c.width = s.w;
          c.height = s.h;
          c.style.width = s.w + "px";
          c.style.height = s.h + "px";
        } else {
          // restore default game viewport
          s.w = 1600;
          s.h = 900;
          c.width = s.w;
          c.height = s.h;
          c.style.width = s.w + "px";
          c.style.height = s.h + "px";
        }
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("fullscreenchange", onFsChange);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const s = state.current;
      if (!s) return;

      if (canvas.width !== s.w || canvas.height !== s.h) {
        canvas.width = s.w;
        canvas.height = s.h;
        canvas.style.width = s.w + "px";
        canvas.style.height = s.h + "px";
      }

      ctx.fillStyle = "#07101a";
      ctx.fillRect(0, 0, s.w, s.h);

      if (keys.current["ArrowLeft"] || keys.current["KeyA"]) {
        s.player.x -= s.player.speed;
      }
      if (keys.current["ArrowRight"] || keys.current["KeyD"]) {
        s.player.x += s.player.speed;
      }
      if (keys.current["Space"]) {
        tryShoot();
      }

      s.player.x = Math.max(s.player.w / 2, Math.min(s.w - s.player.w / 2, s.player.x));

      if (s.player.reload > 0) s.player.reload--;

      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.y -= b.speed;
        if (b.y < -10) {
          s.bullets.splice(i, 1);
          continue;
        }
        for (const inv of s.invaders) {
          if (!inv.alive) continue;
          if (b.x > inv.x && b.x < inv.x + s.invaderW && b.y > inv.y && b.y < inv.y + s.invaderH) {
            inv.alive = false;
            s.bullets.splice(i, 1);
            updateScore((p) => p + 10);
            incrementKills();
            
            // Request item drop from backend (backend controls drop chance via drop pool)
            const username = user?.username || 'guest';
            const enemyX = inv.x + s.invaderW / 2;
            const enemyY = inv.y + s.invaderH / 2;
            
            console.log("💥 Enemy killed! Requesting drop...");
            fetchLootFromBackend(s.level, username).then((loot) => {
              if (loot && loot.dropped) {
                console.log("🎁 Creating falling item:", loot.itemName);
                // Create falling item
                s.droppedItems.push({
                  ...loot,
                  x: enemyX,
                  y: enemyY,
                  velocityY: 0,
                  gravity: 0.06, // slower fall
                  maxFallSpeed: 2,
                  collected: false,
                  size: 28,
                });
              } else {
                console.log("🚫 No drop received from backend");
              }
            }).catch(err => {
              console.error("❌ Drop request failed:", err);
            });
            break;
          }
        }
        if (!s.bullets[i]) continue;
        for (let bi = s.blockades.length - 1; bi >= 0; bi--) {
          const blk = s.blockades[bi];
          if (rectHit(b.x - 2, b.y - 8, 4, 8, blk.x, blk.y, blk.w, blk.h)) {
            blk.hp--;
            s.bullets.splice(i, 1);
            if (blk.hp <= 0) s.blockades.splice(bi, 1);
            break;
          }
        }
      }

      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        const eb = s.enemyBullets[i];
        eb.y += eb.speed;
        if (eb.y > s.h + 10) {
          s.enemyBullets.splice(i, 1);
          continue;
        }
        if (
          rectHit(eb.x - 2, eb.y - 6, 4, 8, s.player.x - s.player.w / 2, s.player.y - 12, s.player.w, s.player.h + 12)
        ) {
          s.enemyBullets.splice(i, 1);
          updateLives((l) => {
            const nl = l - 1;
            if (nl <= 0) {
              s.gameOver = true;
            } else {
              s.player.x = s.w / 2;
            }
            return nl;
          });
          continue;
        }
        for (let bi = s.blockades.length - 1; bi >= 0; bi--) {
          const blk = s.blockades[bi];
          if (rectHit(eb.x - 2, eb.y - 6, 4, 8, blk.x, blk.y, blk.w, blk.h)) {
            blk.hp--;
            s.enemyBullets.splice(i, 1);
            if (blk.hp <= 0) s.blockades.splice(bi, 1);
            break;
          }
        }
      }

      let hitSide = false;
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        inv.x += s.invaderDir * s.invaderSpeed;
        if (inv.x < 6 || inv.x + s.invaderW > s.w - 6) hitSide = true;
      }
      if (hitSide) {
        s.invaderDir *= -1;
        for (const inv of s.invaders) {
          inv.y += 12;
        }
      }

      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        if (inv.y + s.invaderH >= s.player.y) {
          s.gameOver = true;
        }
      }

      // Update falling items
      for (let i = s.droppedItems.length - 1; i >= 0; i--) {
        const item = s.droppedItems[i];
        if (item.collected) continue;

  // Apply gravity with max fall speed to slow drops
  item.velocityY = Math.min((item.velocityY || 0) + (item.gravity || 0.06), item.maxFallSpeed || 2);
  item.y += item.velocityY;

        // Check collision with player
        const playerLeft = s.player.x - s.player.w / 2;
        const playerRight = s.player.x + s.player.w / 2;
        const playerTop = s.player.y - 12;
        const playerBottom = s.player.y + 10;

        const itemLeft = item.x - item.size / 2;
        const itemRight = item.x + item.size / 2;
        const itemTop = item.y - item.size / 2;
        const itemBottom = item.y + item.size / 2;

        if (
          itemLeft < playerRight &&
          itemRight > playerLeft &&
          itemTop < playerBottom &&
          itemBottom > playerTop
        ) {
          // Player collected the item!
          item.collected = true;
          s.droppedItems.splice(i, 1);
          
          // Notify parent component
          if (onLootDrop) {
            onLootDrop({
              ...item,
              timestamp: item.timestamp || new Date().toISOString(),
              timeLabel: item.timeLabel || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
          }
          continue;
        }

        // Remove items that fall off screen
        if (item.y > s.h + 50) {
          s.droppedItems.splice(i, 1);
        }
      }

      const now = Date.now();
      if (now - s.lastEnemyShot > s.enemyShotInterval && s.invaders.some((i) => i.alive)) {
        const byCol = {};
        for (const inv of s.invaders) {
          if (!inv.alive) continue;
          const col = inv.col;  
          if (!byCol[col] || inv.y > byCol[col].y) byCol[col] = inv;
        }
        const cols = Object.keys(byCol);
        const shooter = byCol[cols[Math.floor(Math.random() * cols.length)]];
        if (shooter) {
          s.enemyBullets.push({
            x: shooter.x + s.invaderW / 2,
            y: shooter.y + s.invaderH + 6,
            speed: 3 + s.level * 0.2,
          });
        }
        s.lastEnemyShot = now;
        s.enemyShotInterval = Math.max(300, 600 + Math.random() * 500 - s.level * 40);
      }

      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        ctx.fillStyle = "#78c0ff";
        ctx.fillRect(inv.x, inv.y, s.invaderW, s.invaderH);
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(inv.x + 6, inv.y + 6, s.invaderW - 12, s.invaderH - 8);
      }

      for (const blk of s.blockades) {
        const shade = Math.max(0.12, blk.hp / 3);
        ctx.fillStyle = `rgba(160,200,255,${shade})`;
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
      }

      ctx.fillStyle = "#ffd166";
      for (const b of s.bullets) ctx.fillRect(b.x - 3, b.y - 12, 6, 12);

      ctx.fillStyle = "#ff8b8b";
      for (const eb of s.enemyBullets) ctx.fillRect(eb.x - 3, eb.y - 9, 6, 12);

      ctx.fillStyle = "#4ad994";
      const px = s.player.x;
      const py = s.player.y;
      ctx.beginPath();
      ctx.moveTo(px, py - 18);
      ctx.lineTo(px - s.player.w / 2, py + 15);
      ctx.lineTo(px + s.player.w / 2, py + 15);
      ctx.closePath();
      ctx.fill();

      // Draw falling items
      for (const item of s.droppedItems) {
        if (item.collected) continue;

        // Rarity colors - check both rarity and itemTier fields
        let itemColor = "#9CA3AF"; // Common - gray
        let glowColor = "rgba(156, 163, 175, 0.5)";
        
        const tier = item.itemTier || item.rarity;
        if (tier === "Rare") {
          itemColor = "#3B82F6"; // Rare - blue
          glowColor = "rgba(59, 130, 246, 0.6)";
        } else if (tier === "Legendary") {
          itemColor = "#FFD700"; // Legendary - gold
          glowColor = "rgba(255, 215, 0, 0.7)";
        }

        // Draw glow effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;
        
        // Draw item as a glowing gem/crystal
        ctx.fillStyle = itemColor;
        ctx.beginPath();
        ctx.arc(item.x, item.y, item.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw sparkle effect
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(item.x, item.y - item.size / 2 - 2);
        ctx.lineTo(item.x, item.y + item.size / 2 + 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(item.x - item.size / 2 - 2, item.y);
        ctx.lineTo(item.x + item.size / 2 + 2, item.y);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText(`Score: ${score}`, 12, 20);
      ctx.fillText(`Lives: ${lives}`, s.w - 100, 20);
      ctx.fillText(`Level: ${level}`, s.w / 2 - 24, 20);

      if (s.gameOver) {
        if (!gameOver) {
          setGameOver(true);
          setRunning(false);

          // Report high score to server when the game ends (only once)
          // Only submit for authenticated users (avoid creating guest users)
          if (user && user.username) {
            (async () => {
              try {
                console.log(`🏁 Game over - submitting highscore for ${user.username}: ${score}`);
                const r = await axios.post('/api/user/highscore', { username: user.username, score });
                console.log('📤 Highscore submission result:', r.data);
              } catch (err) {
                console.error('❌ Failed to submit highscore:', err.response?.data || err.message);
              }
            })();
          }
        }

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.fillStyle = "#ff6b6b";
        ctx.font = "36px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", s.w / 2, s.h / 2 - 10);
        ctx.font = "18px Inter, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Press Space to play again", s.w / 2, s.h / 2 + 22);
        ctx.textAlign = "start";

        return;
      }

      if (!s.invaders.some((i) => i.alive)) {
        const next = Math.min(10, level + 1);
        updateLevel(next);
        s.level = next;
        // reconfigure invaders for new level
        const cfgNext = getInvaderConfig(next);
        s.invaderRows = cfgNext.rows;
        s.invaderCols = cfgNext.cols;
        s.invaderSpeed = cfgNext.speed;
        s.invaders = [];
        const patternNext = generateInvaderPattern(s.invaderRows, s.invaderCols, next);
        for (let r = 0; r < s.invaderRows; r++) {
          for (let c = 0; c < s.invaderCols; c++) {
            if (!patternNext[r][c]) continue;
            const x =
              c * (s.invaderW + s.invaderPadding) +
              (s.w - (s.invaderCols * (s.invaderW + s.invaderPadding) - s.invaderPadding)) / 2;
            const y = r * (s.invaderH + 8) + s.invaderOffsetY;
            s.invaders.push({ x, y, alive: true, row: r, col: c });
          }
        }
        s.blockades = generateBlockadesForLevel(next, s);
        s.lastEnemyShot = Date.now();
        s.enemyShotInterval = Math.max(700 - next * 60, 300);
      }

      s.tick++;
      rafRef.current = requestAnimationFrame(loop);
    };

    if (running) {
      const canvas = canvasRef.current;
      const s = state.current;
      if (canvas && s) {
        canvas.width = s.w;
        canvas.height = s.h;
      }
      rafRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rafRef.current);

      // Draw a one-time pause overlay so the user sees the paused state even
      // though the RAF loop is stopped. We only draw when the game has been
      // started and is not game over.
      try {
        const canvas = canvasRef.current;
        const s = state.current;
        if (canvas && s && s.started && !s.gameOver) {
          const ctx = canvas.getContext("2d");
          // semi-opaque dark overlay
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(0, 0, s.w, s.h);

          // Paused text
          ctx.fillStyle = "#ffffff";
          ctx.font = "48px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("PAUSED", s.w / 2, s.h / 2 - 10);
          ctx.font = "18px Inter, sans-serif";
          ctx.fillText("Press P to continue", s.w / 2, s.h / 2 + 26);
          ctx.textAlign = "start";
        }
      } catch (e) {
        // Drawing overlay is non-critical — swallow errors
        // console.warn('Pause overlay draw failed', e);
      }
    }

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, score, lives, level, gameOver]);

  const toggleFullscreen = async () => {
    const el = containerRef.current || canvasRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen();
      } catch (e) {
        console.warn("fullscreen request failed", e);
      }
    } else {
      try {
        await document.exitFullscreen();
      } catch (e) {
        console.warn("exit fullscreen failed", e);
      }
    }
  };

  return (
    <div ref={containerRef} className="game-frame game-frame--container">
      <canvas ref={canvasRef} className="game-frame__surface" />
    </div>
  );
};

export default GameCanvas;
