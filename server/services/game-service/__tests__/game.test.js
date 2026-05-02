import { describe, it, expect, beforeEach, beforeAll, afterAll, jest } from '@jest/globals';
import GameEngine from '../src/game/GameEngine.js';

let gameSessionManager;
let setIntervalSpy;
let clearIntervalSpy;
let consoleLogSpy;

beforeAll(async () => {
  setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => 1);
  clearIntervalSpy = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const module = await import('../src/game/GameSessionManager.js');
  gameSessionManager = module.default;
});

afterAll(() => {
  setIntervalSpy.mockRestore();
  clearIntervalSpy.mockRestore();
  consoleLogSpy.mockRestore();
});

describe('GameEngine', () => {
  let engine;
  let nowSpy;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    engine = new GameEngine('session-1', 'alice', 1, 1600, 900);
    engine.lastShotTime = 0;
    engine.lastEnemyShot = 0;
  });

  afterEach(() => {
    nowSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('initializes with expected defaults', () => {
    expect(engine.sessionId).toBe('session-1');
    expect(engine.username).toBe('alice');
    expect(engine.level).toBe(1);
    expect(engine.lives).toBe(3);
    expect(engine.gameOver).toBe(false);
    expect(engine.started).toBe(false);
    expect(engine.invaders.length).toBeGreaterThan(0);
  });

  it('moves player and clamps to screen bounds', () => {
    engine.player.x = engine.player.w / 2;
    engine.movePlayer('left');
    expect(engine.player.x).toBe(engine.player.w / 2);

    for (let i = 0; i < 500; i++) {
      engine.movePlayer('right');
    }

    expect(engine.player.x).toBeLessThanOrEqual(engine.w - engine.player.w / 2);
  });

  it('shoots once and respects reload cooldown', () => {
    expect(engine.shoot()).toBe(true);
    expect(engine.bullets).toHaveLength(1);
    expect(engine.shoot()).toBe(false);
  });

  it('adds dropped items with derived defaults', () => {
    engine.addDroppedItem({ itemId: 'item-1', itemName: 'Sword', x: 100, y: 120 });

    expect(engine.droppedItems).toHaveLength(1);
    expect(engine.droppedItems[0]).toMatchObject({
      itemId: 'item-1',
      itemName: 'Sword',
      velocityY: 0,
      collected: false,
    });
  });

  it('returns the current state snapshot', () => {
    const state = engine.getState();

    expect(state).toMatchObject({
      sessionId: 'session-1',
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      paused: false,
      started: false,
      tick: 0,
    });
  });

  it('toggles pause state and start state', () => {
    engine.start();
    expect(engine.started).toBe(true);
    expect(engine.paused).toBe(false);

    engine.pause();
    expect(engine.paused).toBe(true);

    engine.pause();
    expect(engine.paused).toBe(false);
  });

  it('resets the engine to level 1 defaults', () => {
    engine.score = 42;
    engine.lives = 1;
    engine.gameOver = true;
    engine.started = true;
    engine.level = 3;

    engine.reset();

    expect(engine.score).toBe(0);
    expect(engine.lives).toBe(3);
    expect(engine.gameOver).toBe(false);
    expect(engine.started).toBe(false);
    expect(engine.level).toBe(1);
  });

  it('emits player hit and game over when lives reach zero', () => {
    engine.lives = 1;
    engine.invaders = [{ x: 100, y: 100, alive: true, row: 0, col: 0 }];
    engine.player.x = 100;
    engine.player.y = 200;
    engine.enemyBullets = [{ x: 100, y: 200, speed: 0 }];
    engine.lastEnemyShot = Date.now();

    const result = engine.update();

    expect(result.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(['player_hit', 'game_over'])
    );
    expect(engine.gameOver).toBe(true);
    expect(engine.lives).toBe(0);
  });

  it('advances to the next level when all invaders are cleared', () => {
    engine.invaders.forEach((invader) => {
      invader.alive = false;
    });
    engine.lastEnemyShot = Date.now();

    const result = engine.update();

    expect(result.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'level_complete', level: 2 }),
      ])
    );
    expect(engine.level).toBe(2);
  });
});

describe('GameSessionManager', () => {
  beforeEach(() => {
    gameSessionManager.sessions.clear();
    gameSessionManager.userSessions.clear();
    jest.spyOn(Date, 'now').mockReturnValue(2000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    gameSessionManager.sessions.clear();
    gameSessionManager.userSessions.clear();
  });

  it('creates sessions and tracks them by username', () => {
    const { sessionId, gameEngine } = gameSessionManager.createSession('bob', 2, 1200, 800);

    expect(sessionId).toContain('bob_2000_');
    expect(gameEngine).toBeInstanceOf(GameEngine);
    expect(gameSessionManager.hasSession(sessionId)).toBe(true);
    expect(gameSessionManager.getSessionId('bob')).toBe(sessionId);
    expect(gameSessionManager.getSessionByUsername('bob')).toBe(gameEngine);
  });

  it('replaces an existing session for the same username', () => {
    const first = gameSessionManager.createSession('bob', 1, 1200, 800);
    const second = gameSessionManager.createSession('bob', 3, 1200, 800);

    expect(first.gameEngine).not.toBe(second.gameEngine);
    expect(gameSessionManager.getActiveSessionsCount()).toBe(1);
    expect(gameSessionManager.getSessionId('bob')).toBe(second.sessionId);
    expect(gameSessionManager.getSession(second.sessionId)).toBe(second.gameEngine);
  });

  it('updates last activity when a session is read', () => {
    const { sessionId } = gameSessionManager.createSession('carol', 1, 1200, 800);
    const session = gameSessionManager.sessions.get(sessionId);
    session.lastActivity = 1000;

    const engine = gameSessionManager.getSession(sessionId);

    expect(engine).toBeInstanceOf(GameEngine);
    expect(session.lastActivity).toBe(2000);
  });

  it('removes sessions and clears username mapping', () => {
    const { sessionId } = gameSessionManager.createSession('dave', 1, 1200, 800);

    expect(gameSessionManager.removeSession(sessionId)).toBe(true);
    expect(gameSessionManager.hasSession(sessionId)).toBe(false);
    expect(gameSessionManager.getSessionId('dave')).toBeUndefined();
  });

  it('cleans up inactive sessions', () => {
    const active = gameSessionManager.createSession('erin', 1, 1200, 800);
    const stale = gameSessionManager.createSession('frank', 1, 1200, 800);

    gameSessionManager.maxIdleTime = 500;
    gameSessionManager.sessions.get(active.sessionId).lastActivity = 1800;
    gameSessionManager.sessions.get(stale.sessionId).lastActivity = 1000;

    gameSessionManager.cleanupInactiveSessions();

    expect(gameSessionManager.hasSession(active.sessionId)).toBe(true);
    expect(gameSessionManager.hasSession(stale.sessionId)).toBe(false);
  });

  it('returns session statistics', () => {
    const { sessionId } = gameSessionManager.createSession('grace', 4, 1200, 800);

    const stats = gameSessionManager.getStats();

    expect(stats.totalSessions).toBe(1);
    expect(stats.sessions).toHaveLength(1);
    expect(stats.sessions[0]).toMatchObject({
      sessionId,
      username: 'grace',
      level: 4,
      score: 0,
      lives: 3,
      gameOver: false,
    });
  });
});
