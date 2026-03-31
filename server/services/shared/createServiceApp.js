import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

export function createServiceApp(serviceName) {
  const app = express();

  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'https://front-end-game-blockchain.vercel.app',
    'https://game-block-chain-node-js.vercel.app'
  ].filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(new Error('Blocked by CORS policy'), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id']
  }));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  }));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(hpp());

  app.get('/health', (_req, res) => {
    res.json({
      service: serviceName,
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
