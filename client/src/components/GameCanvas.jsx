import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const lootTable = [
  { name: "Nebula Core", rarity: "Legendary" },
  { name: "Photon Shield", rarity: "Epic" },
  { name: "Stellar Prism", rarity: "Rare" },
  { name: "Plasma Charge", rarity: "Uncommon" },
  { name: "Ion Fragment", rarity: "Common" },
];

const rarityWeights = {
  Legendary: 0.02,
  Epic: 0.08,
  Rare: 0.18,
  Uncommon: 0.32,
  Common: 0.4,
};

function rollForLoot(level) {
  const roll = Math.random();
  let cumulative = 0;
  let rarity = "Common";
  for (const [key, weight] of Object.entries(rarityWeights)) {
    cumulative += weight;
    if (roll <= cumulative) {
      rarity = key;
      break;
    }
  }
  const pool = lootTable.filter((item) => item.rarity === rarity) || lootTable;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...chosen,
    rarity,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level,
    timestamp: new Date().toISOString(),
    timeLabel: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

async function fetchLootFromBackend(level) {
  try {
    const response = await axios.post("/api/drop", { level });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch loot from backend:", error);
    return rollForLoot(level);
  }
}

function generateBlockadesForLevel(lvl, g) {
  const blocks = [];
  if (lvl >= 5) return blocks;

  const clusterCount = 3;
  const cellW = 18;
  const cellH = 12;
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

const GameCanvas = ({ onLootDrop, onScoreChange, onLivesChange, onLevelChange }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const keys = useRef({});
  const state = useRef({});
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);

  // Callback helpers to notify parent of state changes
  const updateScore = (newScore) => {
    setScore(newScore);
    if (onScoreChange) onScoreChange(newScore);
  };

  const updateLives = (newLives) => {
    setLives(newLives);
    if (onLivesChange) onLivesChange(newLives);
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
      player: { x: w / 2, y: h - 40, w: 40, h: 10, speed: 5, reload: 0 },
      bullets: [],
      enemyBullets: [],
      invaders: [],
      invaderRows: 4,
      invaderCols: 8,
      invaderW: 36,
      invaderH: 20,
      invaderPadding: 12,
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
    for (let r = 0; r < s.invaderRows; r++) {
      for (let c = 0; c < s.invaderCols; c++) {
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

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
            
            if (Math.random() < 0.25) {
              fetchLootFromBackend(s.level).then((loot) => {
                if (loot && onLootDrop) {
                  onLootDrop(loot);
                }
              });
            }
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
      for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 8);

      ctx.fillStyle = "#ff8b8b";
      for (const eb of s.enemyBullets) ctx.fillRect(eb.x - 2, eb.y - 6, 4, 8);

      ctx.fillStyle = "#4ad994";
      const px = s.player.x;
      const py = s.player.y;
      ctx.beginPath();
      ctx.moveTo(px, py - 12);
      ctx.lineTo(px - s.player.w / 2, py + 10);
      ctx.lineTo(px + s.player.w / 2, py + 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText(`Score: ${score}`, 12, 20);
      ctx.fillText(`Lives: ${lives}`, s.w - 100, 20);
      ctx.fillText(`Level: ${level}`, s.w / 2 - 24, 20);

      if (s.gameOver) {
        if (!gameOver) {
          setGameOver(true);
          setRunning(false);
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
        s.invaderSpeed += 0.3;
        s.invaderRows = Math.min(6, s.invaderRows + 1);
        s.invaders = [];
        for (let r = 0; r < s.invaderRows; r++) {
          for (let c = 0; c < s.invaderCols; c++) {
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
    }

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, score, lives, level, gameOver]);

  return (
    <div className="game-frame">
      <canvas ref={canvasRef} className="game-frame__surface" />
    </div>
  );
};

export default GameCanvas;
