#!/usr/bin/env node
/**
 * Quick setup script for blockchain simulation environment
 * Run: node scripts/setup-blockchain-sim.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎮 Game Blockchain - Simulation Setup\n');
console.log('This script will set up a local blockchain simulation environment.\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env file\n');
} else {
  console.log('⚠️  No .env file found, will create one\n');
}

// Blockchain configuration for simulation
const blockchainConfig = `
# ========================================
# Blockchain Configuration (Simulated)
# ========================================

# Use mock blockchain (no Hardhat required, instant transactions)
BLOCKCHAIN_USE_MOCK=true

# Or use real Hardhat local network (requires: npm run node)
# BLOCKCHAIN_USE_MOCK=false
# BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
# BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# BLOCKCHAIN_CONTRACT_ADDRESS=

# Enable/disable blockchain features entirely
BLOCKCHAIN_ENABLED=true

# Network chain ID (31337 = Hardhat local network)
BLOCKCHAIN_CHAIN_ID=31337
`;

// Check if blockchain config already exists
if (!envContent.includes('BLOCKCHAIN_USE_MOCK')) {
  console.log('📝 Adding blockchain configuration to .env...');
  envContent += blockchainConfig;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Configuration added\n');
} else {
  console.log('ℹ️  Blockchain configuration already exists in .env\n');
}

// Display next steps
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Setup Complete!\n');
console.log('📋 Next Steps:\n');
console.log('1️⃣  Run migrations to create blockchain tables:');
console.log('   npx sequelize-cli db:migrate\n');
console.log('2️⃣  Start your server:');
console.log('   npm run start\n');
console.log('3️⃣  Test the blockchain features:');
console.log('   - Create users and give them items (POST /api/drop)');
console.log('   - List items for trade (POST /api/market/list)');
console.log('   - Execute trades (POST /api/market/buy)\n');
console.log('🎭 SIMULATION MODE:');
console.log('   - All blockchain operations are simulated');
console.log('   - No actual blockchain network required');
console.log('   - Instant transactions (no waiting)');
console.log('   - Perfect for development and testing\n');
console.log('⛓️  To use REAL blockchain (Hardhat):');
console.log('   1. Set BLOCKCHAIN_USE_MOCK=false in .env');
console.log('   2. Run: npm run node (in separate terminal)');
console.log('   3. Run: npm run deploy:localhost');
console.log('   4. Copy contract address to .env');
console.log('   5. Restart server\n');
console.log('📚 Read BLOCKCHAIN_SETUP.md for detailed instructions');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
