import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";import { useEffect, useRef, useState } from "react";

import { useGame } from "../context/GameContext";

const CANVAS_WIDTH = 1280;

const CANVAS_HEIGHT = 720;const CANVAS_HEIGHT = 420;



const lootTable = [const drawRoundedRect = (ctx, x, y, width, height, radius, fillStyle) => {

  { name: "Nebula Core", rarity: "Legendary" },  ctx.fillStyle = fillStyle;

  { name: "Photon Shield", rarity: "Epic" },  ctx.beginPath();

  { name: "Stellar Prism", rarity: "Rare" },  ctx.moveTo(x + radius, y);

  { name: "Plasma Charge", rarity: "Uncommon" },  ctx.lineTo(x + width - radius, y);

  { name: "Ion Fragment", rarity: "Common" },  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);

];  ctx.lineTo(x + width, y + height - radius);

  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);

const rarityWeights = {  ctx.lineTo(x + radius, y + height);

  Legendary: 0.02,  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

  Epic: 0.08,  ctx.lineTo(x, y + radius);

  Rare: 0.18,  ctx.quadraticCurveTo(x, y, x + radius, y);

  Uncommon: 0.32,  ctx.closePath();

  Common: 0.4,  ctx.fill();

};};



/**/**

 * Generates defensive blockades that scale down as levels increase. * Lightweight canvas-powered shooter loop -- good enough to showcase controls,

 */ * scoring, and loot drops without pulling in Phaser for the mock UI.

function generateBlockadesForLevel(level, s) { */

  const blocks = [];const GameCanvas = ({ onLootAwarded }) => {

  if (level >= 6) return blocks;  const canvasRef = useRef(null);

  const { updateScore, loseLife, getRandomLoot } = useGame();

  const clusterCount = 3;  const [status, setStatus] = useState("running");

  const cellW = 18;  const [wave, setWave] = useState(1);

  const cellH = 12;  const [toast, setToast] = useState(null);

  const cols = 5;  const statusRef = useRef(status);

  const rows = 3;  const waveRef = useRef(wave);

  const clusterWidth = cols * cellW;

  const spacing = (s.w - clusterCount * clusterWidth) / (clusterCount + 1);  useEffect(() => {

  const baseY = s.h - 120;    statusRef.current = status;

  }, [status]);

  const fullPattern = [

    [1, 1, 1, 1, 1],  useEffect(() => {

    [1, 1, 1, 1, 1],    waveRef.current = wave;

    [0, 1, 1, 1, 0],  }, [wave]);

  ];

  const reducedPattern = [  useEffect(() => {

    [0, 1, 1, 1, 0],    const canvas = canvasRef.current;

    [0, 1, 1, 1, 0],    if (!canvas) return;

    [0, 0, 1, 0, 0],

  ];    const ctx = canvas.getContext("2d");

  const pattern = level <= 2 ? fullPattern : reducedPattern;    let frameId;

    const toastTimers = [];

  for (let c = 0; c < clusterCount; c++) {    let animationActive = true;

    const clusterX = spacing * (c + 1) + c * clusterWidth + (clusterWidth - cols * cellW) / 2;

    for (let r = 0; r < rows; r++) {    const ship = { x: 0, y: CANVAS_HEIGHT - 80, width: 50, height: 24, velocity: 0 };

      for (let cc = 0; cc < cols; cc++) {    const lasers = [];

        if (!pattern[r][cc]) continue;    let enemies = [];

        blocks.push({    const keys = new Set();

          x: clusterX + cc * cellW,

          y: baseY + r * cellH,    const resize = () => {

          w: cellW - 3,      const containerWidth = canvas.parentElement ? canvas.parentElement.clientWidth - 48 : 920;

          h: cellH - 3,      canvas.width = Math.min(containerWidth, 920);

          hp: 3,      canvas.height = CANVAS_HEIGHT;

        });    };

      }    resize();

    }    ship.x = canvas.width / 2 - ship.width / 2;

  }

  return blocks;    const spawnEnemies = () => {

}      const currentWave = waveRef.current;

      enemies = Array.from({ length: Math.min(20, 5 + currentWave * 2) }, (_, index) => ({

/**        id: `enemy-${currentWave}-${index}`,

 * Runs a simple weighted lottery to create NFT drops with a rarity tag.        x: 60 + (index % 6) * 110,

 */        y: 60 + Math.floor(index / 6) * 70,

function rollForLoot(level) {        width: 42,

  const roll = Math.random();        height: 30,

  let cumulative = 0;        dx: 0.6 + currentWave * 0.05,

  let rarity = "Common";        direction: Math.random() > 0.5 ? 1 : -1,

  for (const [key, weight] of Object.entries(rarityWeights)) {        color: ["#3fb5ff", "#6cf5d9", "#7a89ff"][index % 3],

    cumulative += weight;      }));

    if (roll <= cumulative) {    };

      rarity = key;    spawnEnemies();

      break;

    }    const shoot = () => {

  }      lasers.push({ x: ship.x + ship.width / 2 - 2, y: ship.y - 10, height: 18, width: 4, dy: 6 });

  const pool = lootTable.filter((item) => item.rarity === rarity) || lootTable;    };

  const chosen = pool[Math.floor(Math.random() * pool.length)];

  return {    const handleKeyDown = (event) => {

    ...chosen,      keys.add(event.key.toLowerCase());

    rarity,      if (event.code === "Space") shoot();

    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,      if (event.key.toLowerCase() === "p") {

    level,        setStatus((prev) => (prev === "running" ? "paused" : "running"));

    timestamp: new Date().toISOString(),      }

    timeLabel: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),    };

  };

}    const handleKeyUp = (event) => keys.delete(event.key.toLowerCase());



/**    window.addEventListener("keydown", handleKeyDown);

 * Detects rectangle overlap between two bounding boxes.    window.addEventListener("keyup", handleKeyUp);

 */    window.addEventListener("resize", resize);

function rectHit(x, y, w, h, rx, ry, rw, rh) {

  return x < rx + rw && x + w > rx && y < ry + rh && y + h > ry;    const drawShip = () => {

}      drawRoundedRect(ctx, ship.x, ship.y, ship.width, ship.height, 6, "#ffffff");

    };

/**

 * GameCanvas encapsulates the entire canvas-driven shooter. It exposes    const drawLasers = () => {

 * score/lives/level updates and drop notifications via callbacks so the      ctx.fillStyle = "#3fb5ff";

 * dashboard can reflect live state in other UI cards.      lasers.forEach((laser) => {

 */        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);

const GameCanvas = ({ onStatsChange, onItemDrop, onStatusChange }) => {        laser.y -= laser.dy;

  const canvasRef = useRef(null);      });

  const rafRef = useRef(null);    };

  const keys = useRef({});

  const state = useRef(null);    const drawEnemies = () => {

  const statsRef = useRef({ score: 0, lives: 3, level: 1 });      enemies.forEach((enemy) => {

  const statusRef = useRef("idle");        drawRoundedRect(ctx, enemy.x, enemy.y, enemy.width, enemy.height, 5, enemy.color);

        enemy.x += enemy.dx * enemy.direction;

  const [showOverlay, setShowOverlay] = useState(true);        if (enemy.x <= 20 || enemy.x + enemy.width >= canvas.width - 20) {

          enemy.direction *= -1;

  const notifyStatus = useCallback(          enemy.y += 18;

    (status) => {        }

      statusRef.current = status;      });

      onStatusChange?.(status);    };

    },

    [onStatusChange]    const detectHits = () => {

  );      lasers.forEach((laser, laserIndex) => {

        enemies.forEach((enemy, enemyIndex) => {

  const pushStats = useCallback(          const hit =

    (next) => {            laser.x < enemy.x + enemy.width &&

      statsRef.current = next;            laser.x + laser.width > enemy.x &&

      onStatsChange?.(next);            laser.y < enemy.y + enemy.height &&

    },            laser.y + laser.height > enemy.y;

    [onStatsChange]          if (hit) {

  );            lasers.splice(laserIndex, 1);

            enemies.splice(enemyIndex, 1);

  const updateStats = useCallback(            updateScore(150);

    (changes) => {            if (Math.random() < 0.25) {

      const next = { ...statsRef.current, ...changes };              const loot = getRandomLoot();

      pushStats(next);              setToast(`Loot: ${loot.name} (${loot.rarity})`);

    },              onLootAwarded?.(loot);

    [pushStats]              toastTimers.push(setTimeout(() => setToast(null), 2200));

  );            }

          }

  const initGame = useCallback(        });

    (level = 1) => {      });

      state.current = {    };

        w: CANVAS_WIDTH,

        h: CANVAS_HEIGHT,    const detectPlayerHit = () => {

        player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 40, w: 44, h: 12, speed: 6, reload: 0 },      enemies.forEach((enemy) => {

        bullets: [],        if (enemy.y + enemy.height >= ship.y) {

        enemyBullets: [],          loseLife();

        invaders: [],          setToast("Direct hit! Hull compromised.");

        invaderRows: 4,          toastTimers.push(setTimeout(() => setToast(null), 2200));

        invaderCols: 9,          ship.x = canvas.width / 2 - ship.width / 2;

        invaderW: 48,          enemies = [];

        invaderH: 26,          spawnEnemies();

        invaderPadding: 16,        }

        invaderOffsetY: 50,      });

        invaderDir: 1,    };

        invaderSpeed: 0.24 + level * 0.08,

        lastShotTime: 0,    const tick = () => {

        shotCooldown: 300,      if (!animationActive) return;

        tick: 0,      ctx.clearRect(0, 0, canvas.width, canvas.height);

        gameOver: false,

        level,      ctx.fillStyle = "rgba(255,255,255,0.05)";

        lastEnemyShot: Date.now(),      ctx.fillRect(0, 0, canvas.width, canvas.height);

        enemyShotInterval: Math.max(650 - level * 60, 320),

        blockades: [],      if (statusRef.current === "running") {

        started: false,        if (keys.has("arrowleft") || keys.has("a")) ship.velocity = -5;

      };        else if (keys.has("arrowright") || keys.has("d")) ship.velocity = 5;

        else ship.velocity = 0;

      const s = state.current;

      for (let r = 0; r < s.invaderRows; r++) {        ship.x = Math.min(Math.max(20, ship.x + ship.velocity), canvas.width - ship.width - 20);

        for (let c = 0; c < s.invaderCols; c++) {

          const totalWidth = s.invaderCols * (s.invaderW + s.invaderPadding) - s.invaderPadding;        drawShip();

          const startX = (s.w - totalWidth) / 2;        drawLasers();

          const x = c * (s.invaderW + s.invaderPadding) + startX;        drawEnemies();

          const y = r * (s.invaderH + 12) + s.invaderOffsetY;

          s.invaders.push({ x, y, alive: true, row: r, col: c });        lasers.forEach((laser, index) => {

        }          if (laser.y + laser.height < 0) lasers.splice(index, 1);

      }        });

      s.blockades = generateBlockadesForLevel(level, s);

      pushStats({ score: 0, lives: 3, level });        detectHits();

      notifyStatus("idle");        detectPlayerHit();

    },

    [notifyStatus, pushStats]        if (enemies.length === 0) {

  );          setWave((prev) => prev + 1);

          waveRef.current += 1;

  const tryShoot = useCallback(() => {          updateScore(500);

    const s = state.current;          spawnEnemies();

    if (!s) return;          setToast("Wave cleared! Increasing difficulty.");

    const now = Date.now();          toastTimers.push(setTimeout(() => setToast(null), 1800));

    if (s.player.reload > 0) return;        }

    if (now - s.lastShotTime < s.shotCooldown) return;      } else {

    s.lastShotTime = now;        drawShip();

    s.player.reload = 12;        drawEnemies();

    s.bullets.push({ x: s.player.x, y: s.player.y - 24, speed: 7.2 });        drawLasers();

  }, []);        ctx.fillStyle = "rgba(5, 8, 15, 0.7)";

        ctx.fillRect(0, 0, canvas.width, canvas.height);

  const toggleOverlay = () => setShowOverlay((show) => !show);        ctx.fillStyle = "#ffffff";

        ctx.font = "bold 24px Space Grotesk";

  useEffect(() => {        ctx.textAlign = "center";

    initGame(1);        ctx.fillText("Paused", canvas.width / 2, canvas.height / 2);

      }

    const onKeyDown = (e) => {

      keys.current[e.code] = true;      frameId = requestAnimationFrame(tick);

      if (e.code === "Space") {    };

        e.preventDefault();

        const s = state.current;    tick();

        if (!s?.started) {

          s.started = true;    return () => {

          notifyStatus("running");      animationActive = false;

          return;      cancelAnimationFrame(frameId);

        }      toastTimers.forEach(clearTimeout);

        if (statusRef.current !== "running") {      window.removeEventListener("keydown", handleKeyDown);

          notifyStatus("running");      window.removeEventListener("keyup", handleKeyUp);

        }      window.removeEventListener("resize", resize);

      }    };

      if (e.code === "KeyP") {  }, [updateScore, loseLife, getRandomLoot, onLootAwarded]);

        e.preventDefault();

        if (statusRef.current === "running") notifyStatus("paused");  return (

        else if (statusRef.current === "paused") notifyStatus("running");    <div className="relative glass-panel rounded-3xl p-4 lg:p-6">

      }      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

      if (e.code === "KeyT") toggleOverlay();        <div>

    };          <p className="text-sm text-white/60">Live Simulation</p>

    const onKeyUp = (e) => {          <p className="text-xl font-semibold">Wave {wave}</p>

      keys.current[e.code] = false;        </div>

    };        <div className="flex items-center gap-3">

          <button

    window.addEventListener("keydown", onKeyDown);            type="button"

    window.addEventListener("keyup", onKeyUp);            onClick={() => setStatus((prev) => (prev === "running" ? "paused" : "running"))}

            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"

    return () => {          >

      window.removeEventListener("keydown", onKeyDown);            {status === "running" ? "Pause (P)" : "Resume"}

      window.removeEventListener("keyup", onKeyUp);          </button>

      cancelAnimationFrame(rafRef.current);          <div className="text-xs text-white/60">

    };            Move: ←/→ or A/D • Shoot: Space • Pause: P

  }, [initGame, notifyStatus]);          </div>

        </div>

  useEffect(() => {      </div>

    if (statusRef.current !== "running") return undefined;

      <canvas

    const step = () => {        ref={canvasRef}

      const canvas = canvasRef.current;        height={CANVAS_HEIGHT}

      const ctx = canvas?.getContext("2d");        className="w-full rounded-2xl bg-gradient-to-b from-[#080d18] to-[#03050b] border border-white/5"

      const s = state.current;      />

      if (!canvas || !ctx || !s) return;

      {toast && (

      if (canvas.width !== s.w || canvas.height !== s.h) {        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl bg-black/70 px-4 py-2 text-sm font-semibold">

        canvas.width = s.w;          {toast}

        canvas.height = s.h;        </div>

      }      )}

    </div>

      ctx.fillStyle = "#050b12";  );

      ctx.fillRect(0, 0, s.w, s.h);};



      if (keys.current["ArrowLeft"] || keys.current["KeyA"]) s.player.x -= s.player.speed;export default GameCanvas;

      if (keys.current["ArrowRight"] || keys.current["KeyD"]) s.player.x += s.player.speed;
      if (keys.current["Space"]) tryShoot();

      s.player.x = Math.max(s.player.w / 2, Math.min(s.w - s.player.w / 2, s.player.x));
      if (s.player.reload > 0) s.player.reload--;

      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.y -= b.speed;
        if (b.y < -10) {
          s.bullets.splice(i, 1);
          continue;
        }
        let hit = false;
        for (const inv of s.invaders) {
          if (!inv.alive) continue;
          if (b.x > inv.x && b.x < inv.x + s.invaderW && b.y > inv.y && b.y < inv.y + s.invaderH) {
            inv.alive = false;
            s.bullets.splice(i, 1);
            updateStats({ score: statsRef.current.score + 10 });
            if (Math.random() < 0.12) {
              const loot = rollForLoot(statsRef.current.level);
              onItemDrop?.(loot);
            }
            hit = true;
            break;
          }
        }
        if (hit) continue;
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
        if (rectHit(eb.x - 2, eb.y - 6, 4, 8, s.player.x - s.player.w / 2, s.player.y - 10, s.player.w, s.player.h + 12)) {
          s.enemyBullets.splice(i, 1);
          const nextLives = Math.max(0, statsRef.current.lives - 1);
          updateStats({ lives: nextLives });
          if (nextLives <= 0) {
            s.gameOver = true;
            notifyStatus("game-over");
          } else {
            s.player.x = s.w / 2;
          }
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
        if (inv.x < 10 || inv.x + s.invaderW > s.w - 10) hitSide = true;
      }
      if (hitSide) {
        s.invaderDir *= -1;
        for (const inv of s.invaders) {
          if (inv.alive) inv.y += 18;
          if (inv.y + s.invaderH >= s.player.y) {
            s.gameOver = true;
            notifyStatus("game-over");
          }
        }
      }

      const now = Date.now();
      if (now - s.lastEnemyShot > s.enemyShotInterval && s.invaders.some((inv) => inv.alive)) {
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
            speed: 3.1 + statsRef.current.level * 0.24,
          });
          s.lastEnemyShot = now;
          s.enemyShotInterval = Math.max(280, 640 + Math.random() * 520 - statsRef.current.level * 50);
        }
      }

      ctx.fillStyle = "#6fc3ff";
      for (const inv of s.invaders) {
        if (!inv.alive) continue;
        ctx.fillRect(inv.x, inv.y, s.invaderW, s.invaderH);
        ctx.fillStyle = "#091520";
        ctx.fillRect(inv.x + 6, inv.y + 6, s.invaderW - 12, s.invaderH - 10);
        ctx.fillStyle = "#6fc3ff";
      }

      for (const blk of s.blockades) {
        const shade = Math.max(0.18, blk.hp / 3);
        ctx.fillStyle = `rgba(120, 220, 255, ${shade})`;
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
        ctx.strokeStyle = "rgba(10, 30, 40, 0.6)";
        ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
      }

      ctx.fillStyle = "#ffd166";
      for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);

      ctx.fillStyle = "#ff8b8b";
      for (const eb of s.enemyBullets) ctx.fillRect(eb.x - 2, eb.y - 6, 4, 10);

      ctx.fillStyle = "#4ae0a2";
      const px = s.player.x;
      const py = s.player.y;
      ctx.beginPath();
      ctx.moveTo(px, py - 16);
      ctx.lineTo(px - s.player.w / 2, py + 12);
      ctx.lineTo(px + s.player.w / 2, py + 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText(`Score ${statsRef.current.score.toString().padStart(4, "0")}`, 16, 28);
      ctx.fillText(`Lives ${statsRef.current.lives}`, s.w - 130, 28);
      ctx.fillText(`Level ${statsRef.current.level}`, s.w / 2 - 40, 28);

      if (s.gameOver) {
        ctx.fillStyle = "rgba(2, 8, 16, 0.75)";
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.fillStyle = "#ff6b6b";
        ctx.font = "42px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", s.w / 2, s.h / 2 - 10);
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'Inter', sans-serif";
        ctx.fillText("Press Space to restart", s.w / 2, s.h / 2 + 28);
        ctx.textAlign = "start";
        notifyStatus("game-over");
        cancelAnimationFrame(rafRef.current);
        return;
      }

      if (!s.invaders.some((inv) => inv.alive)) {
        const nextLevel = Math.min(12, statsRef.current.level + 1);
        updateStats({ level: nextLevel });
        s.level = nextLevel;
        s.invaderSpeed += 0.22;
        s.invaderRows = Math.min(7, s.invaderRows + 1);
        s.invaders = [];
        for (let r = 0; r < s.invaderRows; r++) {
          for (let c = 0; c < s.invaderCols; c++) {
            const totalWidth = s.invaderCols * (s.invaderW + s.invaderPadding) - s.invaderPadding;
            const startX = (s.w - totalWidth) / 2;
            const x = c * (s.invaderW + s.invaderPadding) + startX;
            const y = r * (s.invaderH + 12) + s.invaderOffsetY;
            s.invaders.push({ x, y, alive: true, row: r, col: c });
          }
        }
        s.enemyBullets = [];
        s.blockades = generateBlockadesForLevel(nextLevel, s);
        s.lastEnemyShot = Date.now();
        s.enemyShotInterval = Math.max(480 - nextLevel * 26, 260);
      }

      s.tick++;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [notifyStatus, onItemDrop, tryShoot, updateStats]);

  const status = statusRef.current;

  return (
    <div className="game-frame">
      <div className="game-toolbar">
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (status === "running") return;
            const s = state.current;
            if (!s.started || status === "game-over") initGame(1);
            s.started = true;
            notifyStatus("running");
          }}
        >
          {status === "running" ? "Running" : "Start Run"}
        </button>
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => notifyStatus(status === "paused" ? "running" : "paused")}
          >
            {status === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              initGame(1);
              state.current.started = false;
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} className="game-main-canvas" />
        <div className={`game-overlay ${showOverlay ? "show" : "hide"}`}>
          <div className="overlay-content">
            <header>
              <h3>Controls</h3>
              <button type="button" className="btn ghost" onClick={toggleOverlay}>
                {showOverlay ? "Hide" : "Show"}
              </button>
            </header>
            <ul>
              <li>Move with ← → or A D</li>
              <li>Shoot with Space (also starts)</li>
              <li>Pause / resume with P</li>
              <li>Toggle this panel with T</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
