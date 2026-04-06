const { spawn } = require('child_process');
const path = require('path');

const serviceCommands = [
  { name: 'fail2ban-service', cmd: 'npm run start:fail2ban' },
  { name: 'auth-service', cmd: 'npm run start:auth' },
  { name: 'user-service', cmd: 'npm run start:user' },
  { name: 'inventory-service', cmd: 'npm run start:inventory' },
  { name: 'marketplace-service', cmd: 'npm run start:marketplace' },
  { name: 'trade-service', cmd: 'npm run start:trade' },
  { name: 'blockchain-service', cmd: 'npm run start:blockchain' },
  { name: 'admin-service', cmd: 'npm run start:admin' },
  { name: 'game-service', cmd: 'npm run start:game' }
];

const cwd = path.resolve(__dirname, '..');

for (const service of serviceCommands) {
  const child = spawn(service.cmd, {
    cwd,
    shell: true,
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code) => {
    console.log(`[${service.name}] exited with code ${code}`);
  });
}
