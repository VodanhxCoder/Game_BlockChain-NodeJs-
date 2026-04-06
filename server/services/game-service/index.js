import { createServer } from 'http';
import { Server } from 'socket.io';
import GameController from './src/controllers/GameController.js';
import { createServiceApp } from '../shared/createServiceApp.js';

const app = createServiceApp('game-service');
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://front-end-game-blockchain.vercel.app',
  'https://game-block-chain-node-js.vercel.app'
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

const gameController = new GameController(io);
io.on('connection', (socket) => gameController.initializeSocketHandlers(socket));

const port = parseInt(process.env.GAME_SERVICE_PORT || process.env.PORT || '4008', 10);
httpServer.listen(port, () => {
  console.log(`[game-service] listening on port ${port}`);
});
