import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const GameCanvas = ({ onLootDrop, onScoreChange, onLivesChange, onLevelChange }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const keys = useRef({});
  const socketRef = useRef(null);
  const gameState = useRef(null);
  
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const { user } = useAuth();

  // Update parent components when state changes
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

  // Initialize WebSocket connection
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Handle connection
    socket.on('connect', () => {
      console.log('🔌 Connected to game server');
      console.log('Socket ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
    });

    // Handle game state updates from server
    socket.on('game:state', (state) => {
      gameState.current = state;
      
      // Update UI state
      if (state.score !== score) updateScore(state.score);
      if (state.lives !== lives) updateLives(state.lives);
      if (state.level !== level) updateLevel(state.level);
      if (state.gameOver !== gameOver) setGameOver(state.gameOver);
      if (state.paused !== paused) setPaused(state.paused);
      if (state.sessionId !== sessionId) setSessionId(state.sessionId);
    });

    // Handle item collection
    socket.on('game:item_collected', (item) => {
      if (onLootDrop) {
        onLootDrop({
          ...item,
          timestamp: item.timestamp || new Date().toISOString(),
          timeLabel: item.timeLabel || new Date().toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          }),
        });
      }
    });

    // Handle game over
    socket.on('game:over', (data) => {
      console.log(`💀 Game Over - Score: ${data.score}`);
      setGameOver(true);
    });

    // Handle level complete
    socket.on('game:level_complete', (data) => {
      console.log(`🎉 Level ${data.level} Complete!`);
    });

    // Handle pause state
    socket.on('game:paused', (data) => {
      console.log('⏸️ Pause state changed:', data.paused);
      setPaused(data.paused);
      if (gameState.current) {
        gameState.current.paused = data.paused;
      }
    });

    // Handle errors
    socket.on('game:error', (error) => {
      console.error('❌ Game error:', error.message);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const onKeyDown = (e) => {
      const socket = socketRef.current;
      const state = gameState.current;

      if (e.code === "Space") {
        e.preventDefault();
        
        if (state && state.gameOver) {
          // Restart game
          socket.emit('game:reset', { 
            sessionId: sessionId, 
            username: user?.username || 'guest' 
          });
          setGameOver(false);
          return;
        }

        if (!state || (state && !state.started)) {
          // Start game - allow starting even if state is null
          socket.emit('game:start', { 
            username: user?.username || 'guest', 
            level: 1 
          });
          return;
        }

        // Shoot
        if (state && state.started) {
          socket.emit('game:shoot', { sessionId: sessionId });
        }
      }

      if (e.code === "KeyP") {
        e.preventDefault();
        console.log('🎮 Pause key pressed, current state:', state?.started, state?.paused);
        if (state && state.started) {
          socket.emit('game:pause', { sessionId: sessionId });
        }
      }

      keys.current[e.code] = true;
    };

    const onKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [sessionId, user]);

  // Send movement commands to server
  useEffect(() => {
    const movementInterval = setInterval(() => {
      const socket = socketRef.current;
      const state = gameState.current;
      
      if (!socket || !state || state.gameOver || state.paused || !state.started) return;

      if (keys.current["ArrowLeft"] || keys.current["KeyA"]) {
        socket.emit('game:move', { sessionId: sessionId, direction: 'left' });
      }
      if (keys.current["ArrowRight"] || keys.current["KeyD"]) {
        socket.emit('game:move', { sessionId: sessionId, direction: 'right' });
      }
    }, 16); // ~60 FPS

    return () => clearInterval(movementInterval);
  }, [sessionId]);

  // Rendering loop - only renders, no game logic
  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      const s = gameState.current;

      if (!s) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Set canvas dimensions
      if (canvas.width !== s.w || canvas.height !== s.h) {
        canvas.width = s.w;
        canvas.height = s.h;
        canvas.style.width = s.w + "px";
        canvas.style.height = s.h + "px";
      }

      // Clear canvas
      ctx.fillStyle = "#07101a";
      ctx.fillRect(0, 0, s.w, s.h);

      // Draw invaders
      for (const inv of s.invaders || []) {
        ctx.fillStyle = "#78c0ff";
        ctx.fillRect(inv.x, inv.y, s.invaderW, s.invaderH);
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(inv.x + 6, inv.y + 6, s.invaderW - 12, s.invaderH - 8);
      }

      // Draw blockades
      for (const blk of s.blockades || []) {
        const shade = Math.max(0.12, blk.hp / 3);
        ctx.fillStyle = `rgba(160,200,255,${shade})`;
        ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
      }

      // Draw player bullets
      ctx.fillStyle = "#ffd166";
      for (const b of s.bullets || []) {
        ctx.fillRect(b.x - 3, b.y - 12, 6, 12);
      }

      // Draw enemy bullets
      ctx.fillStyle = "#ff8b8b";
      for (const eb of s.enemyBullets || []) {
        ctx.fillRect(eb.x - 3, eb.y - 9, 6, 12);
      }

      // Draw player
      if (s.player) {
        ctx.fillStyle = "#4ad994";
        const px = s.player.x;
        const py = s.player.y;
        ctx.beginPath();
        ctx.moveTo(px, py - 18);
        ctx.lineTo(px - s.player.w / 2, py + 15);
        ctx.lineTo(px + s.player.w / 2, py + 15);
        ctx.closePath();
        ctx.fill();
      }

      // Draw falling items
      for (const item of s.droppedItems || []) {
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

        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;
        
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

      // Draw UI
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText(`Score: ${s.score}`, 12, 20);
      ctx.fillText(`Lives: ${s.lives}`, s.w - 100, 20);
      ctx.fillText(`Level: ${s.level}`, s.w / 2 - 24, 20);

      // Draw game over screen
      if (s.gameOver) {
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
      }

      // Draw pause screen
      if (s.paused && s.started && !s.gameOver) {
        console.log('🎨 Drawing pause overlay');
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.fillStyle = "#4ad994";
        ctx.font = "36px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", s.w / 2, s.h / 2 - 10);
        ctx.font = "18px Inter, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("Press P to continue", s.w / 2, s.h / 2 + 22);
        ctx.textAlign = "start";
      }

      // Draw start screen
      if (!s.started && !s.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.fillStyle = "#ffffff";
        ctx.font = "36px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Press Space to Start", s.w / 2, s.h / 2);
        ctx.textAlign = "start";
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="game-frame">
      <canvas ref={canvasRef} className="game-frame__surface" />
    </div>
  );
};

export default GameCanvas;
