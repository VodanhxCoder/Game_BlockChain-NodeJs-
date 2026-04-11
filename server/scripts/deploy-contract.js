import hre from 'hardhat';
import fs from 'fs';

async function main() {
  console.log('Deploying ItemTradingNFT contract...');

  const ItemTradingNFT = await hre.ethers.getContractFactory('ItemTradingNFT');
  const contract = await ItemTradingNFT.deploy();

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('ItemTradingNFT deployed to:', contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: (await hre.ethers.getSigners())[0].address,
  };

  fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));

  console.log('\nDeployment info saved to deployment.json');
  console.log('Contract address:', contractAddress);
  console.log('Network:', hre.network.name);

  // Auto-update .env file
  const envPath = './.env';
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Update or add CONTRACT_ADDRESS
  const contractAddressRegex = /^(BLOCKCHAIN_)?CONTRACT_ADDRESS=.*/m;
  
  if (contractAddressRegex.test(envContent)) {
    // Update existing
    envContent = envContent.replace(contractAddressRegex, `CONTRACT_ADDRESS=${contractAddress}`);
    console.log('\n[OK] Updated CONTRACT_ADDRESS in .env');
  } else {
    // Add new entry
    envContent += `\n# Auto-generated contract address\nCONTRACT_ADDRESS=${contractAddress}\n`;
    console.log('\n[OK] Added CONTRACT_ADDRESS to .env');
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
