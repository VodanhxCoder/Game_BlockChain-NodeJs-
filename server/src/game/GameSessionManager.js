/**
 * GameSessionManager.js
 * 
 * Manages active game sessions, handles session creation,
 * cleanup of inactive sessions, and session state retrieval.
 */

import GameEngine from './GameEngine.js';

class GameSessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> GameEngine
    this.userSessions = new Map(); // username -> sessionId
    this.cleanupInterval = 30 * 60 * 1000; // 30 minutes
    this.maxIdleTime = 15 * 60 * 1000; // 15 minutes
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Create a new game session for a user
   */
  createSession(username, level = 1) {
    // If user already has a session, clean it up first
    if (this.userSessions.has(username)) {
      const oldSessionId = this.userSessions.get(username);
      this.removeSession(oldSessionId);
    }

    const sessionId = `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const gameEngine = new GameEngine(sessionId, username, level);
    
    this.sessions.set(sessionId, {
      engine: gameEngine,
      username,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
    
    this.userSessions.set(username, sessionId);
    
    console.log(`🎮 Created game session: ${sessionId} for user: ${username}`);
    return { sessionId, gameEngine };
  }

  /**
   * Get a game session by sessionId
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      return session.engine;
    }
    return null;
  }

  /**
   * Get a game session by username
   */
  getSessionByUsername(username) {
    const sessionId = this.userSessions.get(username);
    if (sessionId) {
      return this.getSession(sessionId);
    }
    return null;
  }

  /**
   * Get session ID for a username
   */
  getSessionId(username) {
    return this.userSessions.get(username);
  }

  /**
   * Remove a session
   */
  removeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.userSessions.delete(session.username);
      this.sessions.delete(sessionId);
      console.log(`🗑️ Removed game session: ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  /**
   * Get all active sessions count
   */
  getActiveSessionsCount() {
    return this.sessions.size;
  }

  /**
   * Clean up inactive sessions
   */
  cleanupInactiveSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.maxIdleTime) {
        this.removeSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive game sessions`);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, this.cleanupInterval);
    
    console.log('🕐 Game session cleanup timer started');
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([id, session]) => ({
        sessionId: id,
        username: session.username,
        level: session.engine.level,
        score: session.engine.score,
        lives: session.engine.lives,
        gameOver: session.engine.gameOver,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
      })),
    };
  }
}

// Export singleton instance
const gameSessionManager = new GameSessionManager();
export default gameSessionManager;
