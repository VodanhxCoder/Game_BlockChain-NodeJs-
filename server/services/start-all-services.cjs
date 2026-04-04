const { spawn } = require('child_process');
const path = require('path');

const serviceCommands = [
  { name: 'auth-service', cwd: path.resolve(__dirname, 'auth-service') },
  { name: 'user-service', cwd: path.resolve(__dirname, 'user-service') },
  { name: 'inventory-service', cwd: path.resolve(__dirname, 'inventory-service') },
  { name: 'marketplace-service', cwd: path.resolve(__dirname, 'marketplace-service') },
  { name: 'trade-service', cwd: path.resolve(__dirname, 'trade-service') },
  { name: 'blockchain-service', cwd: path.resolve(__dirname, 'blockchain-service') },
  { name: 'admin-service', cwd: path.resolve(__dirname, 'admin-service') },
  { name: 'game-service', cwd: path.resolve(__dirname, 'game-service') }
];

for (const service of serviceCommands) {
  const child = spawn('npm', ['run', 'start'], {
    cwd: service.cwd,
    shell: true,
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code) => {
    console.log(`[${service.name}] exited with code ${code}`);
  });
}
