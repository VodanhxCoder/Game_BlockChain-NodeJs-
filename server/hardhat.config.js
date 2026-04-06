// Bridge file to satisfy Hardhat's root config discovery.
// Actual config lives in services/blockchain-service/config/hardhat.config.cjs.

// Re-export from .cjs file
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('./services/blockchain-service/config/hardhat.config.cjs');
export default config;
