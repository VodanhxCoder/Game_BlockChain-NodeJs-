import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine.js";
import initWebRoutes from "./route/web.js";
import { testConnection } from "./config/sequelize.js";
import cors from "cors";
import helmet from "helmet";
import xssSanitizer from "./middleware/xssSanitizer.js";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import dotenv from 'dotenv';
dotenv.config(); //tải biến môi trường từ file .env
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createServer } from 'http';
import { Server } from 'socket.io';
import GameController from './controllers/GameController.js';

// Import HardhatBlockchainService (CommonJS module)
const require = createRequire(import.meta.url);
const HardhatBlockchainService = require('./services/HardhatBlockchainService');

// Use ESM imports for session and passport
import session from 'express-session';
import passport from './config/passport.js';

// Provide `__dirname` compatibility for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let app = express();
const httpServer = createServer(app);

// CORS Configuration - MUST be first, before any other middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  "https://front-end-game-blockchain.vercel.app",
  "https://game-block-chain-node-js.vercel.app"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
    exposedHeaders: ['Content-Length', 'X-JSON']
}));

// Initialize Socket.IO with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Initialize Game Controller
const gameController = new GameController(io);

// Set up Socket.IO event handlers
io.on('connection', (socket) => {
  gameController.initializeSocketHandlers(socket);
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from other origins
  crossOriginEmbedderPolicy: false                       // avoid COEP blocking
}));

// Trust proxy (required for Ngrok/Vercel/Heroku)
app.set('trust proxy', 1);

// Determine if we are in a secure environment (HTTPS)
const clientUrl = (process.env.CLIENT_URL || '').trim();
const isSecure = process.env.NODE_ENV === 'production' || clientUrl.startsWith('https');

console.log('------------------------------------------------');
console.log('[Config] CLIENT_URL:', clientUrl);
console.log('[Config] isSecure:', isSecure);
console.log('[Config] Cookie Settings:', {
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax'
});
console.log('------------------------------------------------');

// Session configuration (required for passport OAuth state)
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isSecure, 
        httpOnly: true,
        maxAge: 60000 // Short lived, just for handshake
    }
}));

// Initialize Passport
app.use(passport.initialize());
// app.use(passport.session()); // Not needed for JWT

//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data Sanitization against XSS
app.use(xssSanitizer);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Debug Middleware: Check if cookies are being received
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const cookie = req.headers.cookie;
    if (req.path.startsWith('/api/auth')) {
        console.log(`[Request] ${req.method} ${req.path}`);
        console.log(`   Origin: ${origin}`);
        console.log(`   Protocol: ${req.protocol}`);
        console.log(`   Secure: ${req.secure}`);
        console.log(`   Cookie: ${cookie ? 'Present' : 'MISSING'}`);
        if (cookie) console.log(`   Cookie Content: ${cookie}`);
        
        // Hook into response to log Set-Cookie
        const originalSetHeader = res.setHeader;
        res.setHeader = function(name, value) {
            if (name.toLowerCase() === 'set-cookie') {
                console.log(`   [Response] Set-Cookie: ${JSON.stringify(value)}`);
            }
            return originalSetHeader.apply(this, arguments);
        };
    }
    next();
});

// Serve uploaded files from /server/uploads at client path /uploads
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {  
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Note: Fail2Ban middleware is applied only to auth routes to reduce noise.

// Optionally auto-start the Python Fail2Ban service when the Node server starts.
// Controlled via environment variable FAIL2BAN_AUTO_START (defaults to 'true').
try {
    // Default to auto-starting the Python Fail2Ban service. If you need to
    // disable auto-start (e.g., on CI or systems without Python/Flask), set
    // environment variable `FAIL2BAN_AUTO_START=false`.
    const AUTO_START = (process.env.FAIL2BAN_AUTO_START || 'true').toLowerCase() === 'true';
    if (AUTO_START) {
        const pythonCmd = process.env.FAIL2BAN_PYTHON || 'python';
        const scriptPath = path.resolve(__dirname, '..', 'fail2ban_service', 'app.py');
        if (fs.existsSync(scriptPath)) {
            console.log('Auto-starting Fail2Ban Python service:', scriptPath);
            const child = spawn(pythonCmd, [scriptPath], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: process.env,
            });

            child.stdout.on('data', (d) => {
                const s = String(d);
                s.split(/\r?\n/).forEach(line => {
                    if (line && line.trim() !== '') process.stdout.write(`[fail2ban] ${line}\n`);
                });
            });
            child.stderr.on('data', (d) => {
                const s = String(d);
                s.split(/\r?\n/).forEach(line => {
                    if (line && line.trim() !== '') process.stderr.write(`[fail2ban-error] ${line}\n`);
                });
            });

            child.on('exit', (code, signal) => {
                console.log(`Fail2Ban service exited with code=${code} signal=${signal}`);
            });

            // Handle spawn errors (e.g., python not found) so Node doesn't crash
            child.on('error', (err) => {
                console.error('[fail2ban-error] Failed to start Fail2Ban service:', err && err.message ? err.message : err);
            });

            // Ensure the child is killed when the parent exits
            const killChild = () => {
                try {
                    child.kill();
                } catch (e) {}
            };
            process.on('exit', killChild);
            process.on('SIGINT', () => { killChild(); process.exit(); });
            process.on('SIGTERM', () => { killChild(); process.exit(); });
        } else {
            console.warn('Fail2Ban script not found at', scriptPath, '- skipping auto-start.');
        }
    }
} catch (e) {
    console.error('Error while attempting to auto-start Fail2Ban service:', e && e.message);
}

//init web route
initWebRoutes(app);
viewEngine(app);
testConnection();

// Initialize blockchain service
(async () => {
    try {
        await HardhatBlockchainService.initialize();
    } catch (error) {
        console.error('Failed to initialize blockchain service:', error.message);
    }
})();

// Default to port 3000 when PORT not set (was incorrectly defaulting to 3)
let port = parseInt(process.env.PORT, 10) || 3000;
httpServer.listen(port, () => {
    console.log(`Backend nodejs is running on port: ${port}`);
    console.log(`🎮 Game WebSocket server is ready`);
});


