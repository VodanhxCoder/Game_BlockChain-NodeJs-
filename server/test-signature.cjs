require('dotenv').config();
const { ethers } = require('ethers');

async function testSignature() {
  try {
    console.log('🔍 Testing signature verification...\n');
    
    // Connect to Hardhat network
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Use Hardhat account #0 (seller)
    const sellerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    const sellerWallet = new ethers.Wallet(sellerPrivateKey, provider);
    
    // Use Hardhat account #1 (buyer)
    const buyerPrivateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
    const buyerWallet = new ethers.Wallet(buyerPrivateKey, provider);
    
    console.log('Seller address:', sellerWallet.address);
    console.log('Buyer address:', buyerWallet.address);
    
    // Example data
    const sellerItemHash = '0x' + 'a'.repeat(64);
    const listingId = 1;
    const timestamp = Date.now();
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    console.log('\nContract address:', contractAddress);
    console.log('Listing ID:', listingId);
    console.log('Timestamp:', timestamp);
    
    // Create the message hash exactly as the contract does
    const messageHash = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint256', 'uint256', 'address'],
      [sellerItemHash, listingId, timestamp, contractAddress]
    );
    
    console.log('\nMessage hash:', messageHash);
    
    // Sign the message as seller
    const signature = await sellerWallet.signMessage(ethers.getBytes(messageHash));
    console.log('Signature:', signature);
    
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
    console.log('\nRecovered address:', recoveredAddress);
    console.log('Matches seller?', recoveredAddress.toLowerCase() === sellerWallet.address.toLowerCase());
    
    // Now test what the contract will do
    console.log('\n🔍 Testing contract recovery...');
    
    // The contract uses: message.toEthSignedMessageHash().recover(signature)
    // In ethers v6, this is equivalent to verifyMessage with getBytes
    const ethSignedHash = ethers.hashMessage(ethers.getBytes(messageHash));
    console.log('ETH signed message hash:', ethSignedHash);
    
    const recovered = ethers.recoverAddress(ethSignedHash, signature);
    console.log('Contract-style recovery:', recovered);
    console.log('Matches seller?', recovered.toLowerCase() === sellerWallet.address.toLowerCase());
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testSignature();
