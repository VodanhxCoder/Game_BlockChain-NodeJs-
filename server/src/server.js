import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./route/web";
import { testConnection } from "./config/sequelize";
import cors from "cors";
require('dotenv').config(); //tải biến môi trường từ file .env
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let app = express();

//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use(cors());

// Note: Fail2Ban middleware is applied only to auth routes to reduce noise.

// Optionally auto-start the Python Fail2Ban service when the Node server starts.
// Controlled via environment variable FAIL2BAN_AUTO_START (defaults to 'true').
try {
    const AUTO_START = (process.env.FAIL2BAN_AUTO_START || 'true').toLowerCase() !== 'false';
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


let port = process.env.PORT || 6969;
app.listen(port, () => {
    console.log("Backend nodejs is running on the port: " + port);
});


