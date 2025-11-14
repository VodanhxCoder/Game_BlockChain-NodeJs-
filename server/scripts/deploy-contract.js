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
  console.log('\nUpdate your .env file with:');
  console.log(`BLOCKCHAIN_CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
