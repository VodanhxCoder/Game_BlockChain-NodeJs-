// This file exists to satisfy Hardhat's requirement for hardhat.config.js
// The actual configuration is in hardhat.config.cjs (CommonJS format)
// which Hardhat will auto-detect and use.

// Re-export from .cjs file
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('./hardhat.config.cjs');
export default config;
