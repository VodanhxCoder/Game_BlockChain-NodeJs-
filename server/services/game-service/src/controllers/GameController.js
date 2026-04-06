/**
 * GameController.js
 * 
 * Handles WebSocket events for real-time game interactions.
 * Manages game state updates and communicates with clients.
 */

import gameSessionManager from '../game/GameSessionManager.js';
import axios from 'axios';
import DropController from '../../../inventory-service/src/controllers/DropController.js';
import { updateUserHighScore } from '../../../user-service/src/controllers/UserController.js';

class GameController {
  constructor(io) {
    this.io = io;
    this.updateInterval = 1000 / 60; // 60 FPS
    this.gameLoops = new Map(); // sessionId -> interval
  }

  /**
   * Initialize socket event handlers
   */
  initializeSocketHandlers(socket) {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Start a new game
    socket.on('game:start', async (data) => {
      try {
        const { username, level = 1, width, height } = data;
        console.log(`🎮 Starting game for ${username}, level ${level}, size: ${width}x${height}`);

        // Create new game session
        const { sessionId, gameEngine } = gameSessionManager.createSession(username, level, width, height);
        gameEngine.start();

        // Join socket room for this session
        socket.join(sessionId);
        socket.sessionId = sessionId;
        socket.username = username;

        // Start game loop for this session
        this.startGameLoop(sessionId);

        // Send initial state
        socket.emit('game:state', gameEngine.getState());
        
        console.log(`✅ Game started: ${sessionId}`);
      } catch (error) {
        console.error('❌ Error starting game:', error);
        socket.emit('game:error', { message: 'Failed to start game' });
      }
    });

    // Player movement
    socket.on('game:move', (data) => {
      const { sessionId, direction } = data;
      const engine = gameSessionManager.getSession(sessionId);
      
      if (engine) {
        engine.movePlayer(direction);
      }
    });

    // Player shoot
    socket.on('game:shoot', async (data) => {
      const { sessionId } = data;
      const engine = gameSessionManager.getSession(sessionId);
      
      if (engine) {
        const shot = engine.shoot();
        if (shot) {
          socket.emit('game:shot', { success: true });
        }
      }
    });

    // Pause game
    socket.on('game:pause', (data) => {
      const { sessionId } = data;
      const engine = gameSessionManager.getSession(sessionId);
      
      if (engine) {
        engine.pause();
        socket.emit('game:paused', { paused: engine.paused });
      }
    });

    // Reset/restart game
    socket.on('game:reset', (data) => {
      const { sessionId, username } = data;
      
      // Get old dimensions if available
      const oldEngine = gameSessionManager.getSession(sessionId);
      const width = oldEngine ? oldEngine.w : 1600;
      const height = oldEngine ? oldEngine.h : 900;

      // Stop old game loop
      this.stopGameLoop(sessionId);
      
      // Create new session
      const { sessionId: newSessionId, gameEngine } = gameSessionManager.createSession(username, 1, width, height);
      gameEngine.start();
      
      socket.leave(sessionId);
      socket.join(newSessionId);
      socket.sessionId = newSessionId;
      
      // Start new game loop
      this.startGameLoop(newSessionId);
      
      socket.emit('game:state', gameEngine.getState());
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      if (socket.sessionId) {
        // Don't immediately remove session - keep it for potential reconnect
        console.log(`⏸️ Session ${socket.sessionId} disconnected, keeping for potential reconnect`);
      }
    });
  }

  /**
   * Start game loop for a session
   */
  startGameLoop(sessionId) {
    // Stop existing loop if any
    this.stopGameLoop(sessionId);

    const loop = setInterval(async () => {
      const engine = gameSessionManager.getSession(sessionId);
      
      if (!engine) {
        this.stopGameLoop(sessionId);
        return;
      }

      if (engine.gameOver || engine.paused) {
        return;
      }

      // Update game state
      const { events, state } = engine.update();

      // Emit state to all clients in this session
      this.io.to(sessionId).emit('game:state', state);

      // Handle events
      for (const event of events) {
        await this.handleGameEvent(event, engine, sessionId);
      }
    }, this.updateInterval);

    this.gameLoops.set(sessionId, loop);
    console.log(`▶️ Started game loop for session: ${sessionId}`);
  }

  /**
   * Stop game loop for a session
   */
  stopGameLoop(sessionId) {
    const loop = this.gameLoops.get(sessionId);
    if (loop) {
      clearInterval(loop);
      this.gameLoops.delete(sessionId);
      console.log(`⏹️ Stopped game loop for session: ${sessionId}`);
    }
  }

  /**
   * Handle game events (enemy killed, item collected, etc.)
   */
  async handleGameEvent(event, engine, sessionId) {
    try {
      switch (event.type) {
        case 'enemy_killed':
          // Request drop from backend
          const loot = await this.fetchLootFromBackend(event.level, engine.username);
          if (loot && loot.dropped) {
            loot.x = event.x;
            loot.y = event.y;
            engine.addDroppedItem(loot);
            console.log(`🎁 Item dropped: ${loot.itemName} for ${engine.username}`);
          }
          break;

        case 'item_collected':
          // Save item to database when collected
          try {
            if (engine.username && engine.username !== 'guest') {
              const savedItem = await DropController.saveCollectedItem(
                engine.username, 
                event.item.itemId
              );
              // Update item with database info
              event.item.userItemId = savedItem.userItemId;
              event.item.itemHash = savedItem.itemHash;
              event.item.obtainedAt = savedItem.obtainedAt;
            }
          } catch (error) {
            console.error('❌ Error saving collected item:', error);
          }
          
          // Notify client about collected item
          this.io.to(sessionId).emit('game:item_collected', event.item);
          console.log(`✨ Item collected and saved: ${event.item.itemName} by ${engine.username}`);
          break;

        case 'game_over':
          // Submit high score
          if (engine.username && engine.username !== 'guest') {
            await this.submitHighScore(engine.username, event.score);
          }
          this.io.to(sessionId).emit('game:over', { score: event.score });
          this.stopGameLoop(sessionId);
          console.log(`💀 Game over for ${engine.username}, score: ${event.score}`);
          break;

        case 'level_complete':
          this.io.to(sessionId).emit('game:level_complete', { level: event.level });
          console.log(`🎉 Level ${event.level} completed by ${engine.username}`);
          break;

        case 'player_hit':
          this.io.to(sessionId).emit('game:player_hit', { lives: engine.lives });
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('❌ Error handling game event:', error);
    }
  }

  /**
   * Fetch loot from drop service (determines drop without saving)
   */
  async fetchLootFromBackend(level, username) {
    try {
      // Use determineDrop instead of simulateDrop to avoid saving to DB
      const droppedItem = await DropController.determineDrop(username);
      
      if (droppedItem) {
        return {
          itemId: droppedItem.itemId,
          name: droppedItem.itemName,
          itemName: droppedItem.itemName,
          rarity: droppedItem.itemTier,
          itemTier: droppedItem.itemTier,
          itemImage: droppedItem.itemImage,
          itemHash: null, // Will be set when collected
          quantity: 1,
          id: `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          level,
          timestamp: droppedItem.timestamp,
          timeLabel: new Date(droppedItem.timestamp).toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          }),
          dropped: true,
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to determine drop:', error);
      return null;
    }
  }

  /**
   * Submit high score to backend
   */
  async submitHighScore(username, score) {
    try {
      const result = await updateUserHighScore(username, score);
      console.log('📤 High score updated:', result);
    } catch (error) {
      console.error('❌ Failed to submit high score:', error.message);
    }
  }
}

export default GameController;
