# Quick Start Guide - Backend Game Logic

## What Changed?
The game now runs on the server! The frontend only displays what the server tells it to show.

## Installation
```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies  
cd ../client
npm install
```

## Running the Game
```bash
# Terminal 1 - Start Backend
cd server
npm start
# Wait for: "🎮 Game WebSocket server is ready"

# Terminal 2 - Start Frontend
cd client
npm run dev
```

## Testing
1. Open browser to `http://localhost:5173`
2. Press **Space** to start game
3. Use **Arrow Keys** or **WASD** to move
4. Press **Space** to shoot
5. Press **P** to pause

## What to Check
- ✅ Game starts and runs smoothly
- ✅ Movement is responsive
- ✅ Shooting works
- ✅ Enemies move and attack
- ✅ Items drop when enemies die
- ✅ Items can be collected
- ✅ Score and lives update correctly
- ✅ Level progression works
- ✅ Game over and restart works

## Architecture
```
Frontend (Client)          Backend (Server)
┌─────────────────┐       ┌──────────────────┐
│  GameCanvas     │◄──────┤ GameController   │
│  (Rendering)    │       │  (Game Events)   │
└─────────────────┘       └──────────────────┘
        │                          │
        │    WebSocket/Socket.IO   │
        │◄─────────────────────────┤
        │                          │
        │  game:state (60 FPS)     │
        │◄─────────────────────────┤
        │                          │
        │  game:move, game:shoot   │
        ├─────────────────────────►│
        │                          ▼
        │                  ┌──────────────┐
        │                  │ GameEngine   │
        │                  │ (All Logic)  │
        │                  └──────────────┘
        │                          │
        │                  ┌──────────────────┐
        │                  │ GameSessionMgr   │
        │                  │ (Session Track)  │
        │                  └──────────────────┘
```

## Benefits
- **Secure**: Can't cheat by modifying client code
- **Consistent**: Same experience for all players
- **Scalable**: Ready for multiplayer features
- **Server Authority**: Drop rates, scores controlled by server
- **Better Performance**: Client only renders, doesn't compute

## Files Created
- `server/src/game/GameEngine.js` - Game logic
- `server/src/game/GameSessionManager.js` - Session management
- `server/src/controllers/GameController.js` - WebSocket handler
- `client/src/components/GameCanvas.jsx` - Rendering only (refactored)
- `GAME_BACKEND_MIGRATION.md` - Full documentation

## Backup
Original client-side logic saved in:
- `client/src/components/GameCanvas_Old.jsx`

## Troubleshooting
**Game won't start?**
- Check both servers are running
- Check browser console for WebSocket errors
- Verify server shows "🎮 Game WebSocket server is ready"

**Laggy gameplay?**
- Check network latency (should be <10ms on localhost)
- Verify server isn't overloaded
- Check browser performance/CPU

**Items not dropping?**
- Check `/api/drop` endpoint is working
- Review server logs for drop requests

## Next Steps
1. Test thoroughly with the checklist above
2. Monitor server logs for any errors
3. Check performance under load
4. Consider adding more features (spectator mode, replays, etc.)

For detailed information, see `GAME_BACKEND_MIGRATION.md`
