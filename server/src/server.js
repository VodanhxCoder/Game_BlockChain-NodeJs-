import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine.js";
import initWebRoutes from "./route/web.js";
import { testConnection } from "./config/sequelize.js";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config(); //tải biến môi trường từ file .env
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Import HardhatBlockchainService (CommonJS module)
const require = createRequire(import.meta.url);
const HardhatBlockchainService = require('./services/HardhatBlockchainService');

// Provide `__dirname` compatibility for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const session = require('express-session');
const passport = require('./config/passport');

let app = express();

// Session configuration (required for passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to false for localhost development
        httpOnly: true,
        sameSite: 'lax', // Important for OAuth callbacks
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

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
app.listen(port, () => {
    console.log(`Backend nodejs is running on port: ${port}`);
});


