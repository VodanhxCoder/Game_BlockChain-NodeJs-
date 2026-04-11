const { ethers } = require('ethers');
require('dotenv').config();

async function checkOwnership() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // Load contract
  const contractJson = require('../artifacts/contracts/ItemTradingNFT.sol/ItemTradingNFT.json');
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contract = new ethers.Contract(contractAddress, contractJson.abi, provider);

  const itemHash = '8ecf4de662b3c48d6f111c3c34129ce71fff45b65ff725157f657343b79a9037';
  
  console.log('Checking ownership for item:', itemHash);
  
  try {
    const tokenId = await contract.itemHashToTokenId('0x' + itemHash);
    console.log('Token ID:', tokenId.toString());
    
    const owner = await contract.ownerOf(tokenId);
    console.log('Current Owner on Blockchain:', owner);
    
    const seller = '0xcd3b766ccdd6ae721141f452c550ca635964ce71';
    const buyer = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
    
    if (owner.toLowerCase() === seller.toLowerCase()) {
      console.log('[OK] Owner matches Seller (Trade NOT executed on chain)');
    } else if (owner.toLowerCase() === buyer.toLowerCase()) {
      console.log('[WARN] Owner matches Buyer (Trade ALREADY executed on chain)');
    } else {
      console.log('[ERROR] Owner is someone else:', owner);
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkOwnership();
