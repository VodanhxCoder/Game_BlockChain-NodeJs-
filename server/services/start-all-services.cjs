const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const net = require('net');
const fs = require('fs');

const serviceCommands = [
  { name: 'fail2ban-service', cmd: 'npm run start:fail2ban', portEnv: 'FAIL2BAN_SERVICE_PORT', defaultPort: 5000 },
  { name: 'auth-service', cmd: 'npm run start:auth', portEnv: 'AUTH_SERVICE_PORT', defaultPort: 4001 },
  { name: 'user-service', cmd: 'npm run start:user', portEnv: 'USER_SERVICE_PORT', defaultPort: 4002 },
  { name: 'inventory-service', cmd: 'npm run start:inventory', portEnv: 'INVENTORY_SERVICE_PORT', defaultPort: 4003 },
  { name: 'marketplace-service', cmd: 'npm run start:marketplace', portEnv: 'MARKETPLACE_SERVICE_PORT', defaultPort: 4004 },
  { name: 'trade-service', cmd: 'npm run start:trade', portEnv: 'TRADE_SERVICE_PORT', defaultPort: 4005 },
  { name: 'blockchain-service', cmd: 'npm run start:blockchain', portEnv: 'BLOCKCHAIN_SERVICE_PORT', defaultPort: 4006 },
  { name: 'admin-service', cmd: 'npm run start:admin', portEnv: 'ADMIN_SERVICE_PORT', defaultPort: 4007 },
  { name: 'game-service', cmd: 'npm run start:game', portEnv: 'GAME_SERVICE_PORT', defaultPort: 4008 }
];

const cwd = path.resolve(__dirname, '..');
const childProcesses = [];
const deploymentJsonPath = path.join(cwd, 'deployment.json');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getServicePort = (service) => {
  const raw = process.env[service.portEnv];
  if (!raw) return service.defaultPort;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return service.defaultPort;
  return parsed;
};

const spawnManaged = (name, cmd, options = {}) => {
  const child = spawn(cmd, {
    cwd,
    shell: true,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });

  child.__serviceName = name;
  childProcesses.push(child);

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${name}] exited with signal ${signal}`);
    } else {
      console.log(`[${name}] exited with code ${code}`);
    }
  });

  return child;
};

const runCommand = (name, cmd) => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      cwd,
      shell: true,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`[${name}] command failed with code ${code}`));
    });
  });
};

const checkRpcReady = () => {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1,
    });

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8545,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 1500,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            resolve(Boolean(parsed.result));
          } catch (_error) {
            resolve(false);
          }
        });
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(body);
    req.end();
  });
};

const callRpc = (method, params = [], timeout = 1500) => {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    });

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8545,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data || '{}');
            resolve(parsed);
          } catch (_error) {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.write(body);
    req.end();
  });
};

const readDeploymentAddress = () => {
  try {
    if (!fs.existsSync(deploymentJsonPath)) return null;
    const content = fs.readFileSync(deploymentJsonPath, 'utf8');
    const parsed = JSON.parse(content);
    return typeof parsed.contractAddress === 'string' ? parsed.contractAddress : null;
  } catch (_error) {
    return null;
  }
};

const resolveContractAddress = () => {
  return process.env.CONTRACT_ADDRESS || process.env.BLOCKCHAIN_CONTRACT_ADDRESS || readDeploymentAddress();
};

const checkContractCode = async (address) => {
  if (!address) return false;
  const response = await callRpc('eth_getCode', [address, 'latest'], 1500);
  const code = response && typeof response.result === 'string' ? response.result : '0x';
  return code !== '0x';
};

const waitForRpc = async (timeoutMs = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await checkRpcReady();
    if (ready) return true;
    await wait(1000);
  }
  return false;
};

const checkPortAvailable = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', (error) => {
      if (error && error.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port);
  });
};

const getPortOwnerPid = (port) => {
  if (process.platform !== 'win32') return null;

  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });

    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) {
        return pid;
      }
    }

    return null;
  } catch (_error) {
    return null;
  }
};

const preflightServicePorts = async () => {
  const conflicts = [];
  for (const service of serviceCommands) {
    const port = getServicePort(service);
    const available = await checkPortAvailable(port);
    if (!available) {
      conflicts.push({ service: service.name, port, pid: getPortOwnerPid(port) });
    }
  }

  if (conflicts.length > 0) {
    const details = conflicts
      .map((entry) => `${entry.service}:${entry.port}${entry.pid ? ` (pid ${entry.pid})` : ''}`)
      .join(', ');
    throw new Error(`Port preflight failed. Resolve occupied ports before startup: ${details}`);
  }
};

const shutdownAll = () => {
  for (const child of childProcesses) {
    if (!child.killed) {
      try {
        child.kill('SIGTERM');
      } catch (_error) {
        // ignore
      }
    }
  }
};

let hardhatStartedByScript = false;
let isShuttingDown = false;

const deployWithRetry = async (maxAttempts = 2, backoffMs = 2000) => {
  const address = resolveContractAddress();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`[bootstrap][deploy] Attempt ${attempt}/${maxAttempts}`);
      await runCommand('deploy-contract', 'npx hardhat run scripts/deploy-contract.js --network localhost');
      const postDeployAddress = resolveContractAddress();
      const hasCode = await checkContractCode(postDeployAddress);
      if (!hasCode) {
        throw new Error(`deploy reported success but no bytecode found at ${postDeployAddress || '(missing address)'}`);
      }
      console.log(`[bootstrap][deploy] Verified contract bytecode at ${postDeployAddress}`);
      return;
    } catch (error) {
      const hasCodeAtExistingAddress = await checkContractCode(address);
      if (hasCodeAtExistingAddress) {
        console.warn(
          `[bootstrap][deploy] Deploy command failed (${error.message || error}), but existing contract at ${address} has bytecode. Continuing startup.`
        );
        return;
      }

      if (attempt === maxAttempts) {
        throw new Error(`[deploy-contract] failed after ${maxAttempts} attempts: ${error.message || error}`);
      }

      console.warn(
        `[bootstrap][deploy] Attempt ${attempt} failed (${error.message || error}). Retrying in ${backoffMs}ms...`
      );
      await wait(backoffMs);
    }
  }
};

const bootstrapBlockchain = async () => {
  const alreadyReady = await checkRpcReady();
  if (!alreadyReady) {
    console.log('[bootstrap] Starting Hardhat node...');
    spawnManaged('hardhat-node', 'npx hardhat node');
    hardhatStartedByScript = true;
  } else {
    console.log('[bootstrap] Hardhat node already running on 127.0.0.1:8545');
  }

  const rpcReady = await waitForRpc(45000);
  if (!rpcReady) {
    throw new Error('Hardhat JSON-RPC did not become ready in time');
  }

  console.log('[bootstrap] JSON-RPC is ready. Deploying ItemTradingNFT contract...');
  await deployWithRetry(2, 2000);
  console.log('[bootstrap] Deploy stage complete');
};

const startServices = () => {
  for (const service of serviceCommands) {
    spawnManaged(service.name, service.cmd);
  }
};

const setupSignalHandlers = () => {
  const onSignal = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[orchestrator] Received ${signal}, stopping child processes...`);
    shutdownAll();
    setTimeout(() => process.exit(0), 300);
  };

  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
};

const main = async () => {
  setupSignalHandlers();

  try {
    console.log('[orchestrator] Running service port preflight...');
    await preflightServicePorts();
    console.log('[orchestrator] Port preflight passed');
    await bootstrapBlockchain();
    startServices();
  } catch (error) {
    if (!isShuttingDown) {
      isShuttingDown = true;
    }
    console.error('[orchestrator] Startup failed:', error.message || error);
    shutdownAll();
    process.exit(1);
  }
};

main();
