import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

async function showAccounts() {
  try {
    const accounts = await provider.listAccounts();
    
    console.log('\n=== HARDHAT TEST ACCOUNTS ===\n');
    
    for (let i = 0; i < Math.min(accounts.length, 2); i++) {
      const address = accounts[i].address;
      const balance = await provider.getBalance(address);
      
      console.log(`Account #${i}:`);
      console.log(`  Address: ${address}`);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
      console.log('');
    }
    
    console.log('\n=== PRIVATE KEYS (Standard Hardhat) ===\n');
    console.log('Account #0 Private Key:');
    console.log('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    console.log('');
    console.log('Account #1 Private Key:');
    console.log('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
    console.log('');
    console.log('\n=== TO IMPORT INTO METAMASK ===\n');
    console.log('1. Open MetaMask -> Profile Icon -> Import Account');
    console.log('2. Select "Private Key"');
    console.log('3. Paste one of the private keys above');
    console.log('4. Make sure MetaMask is connected to:');
    console.log('   - Network: Hardhat Local');
    console.log('   - RPC URL: http://127.0.0.1:8545');
    console.log('   - Chain ID: 31337');
    console.log('');
    
  } catch (error) {
    console.error('Error connecting to Hardhat:', error.message);
    console.log('\nIs Hardhat running? Start it with: npx hardhat node');
  }
}

showAccounts();
