cd# Quick Start: Hardhat + MetaMask + Trade Logging

## Step 1: Install Dependencies

```bash
cd server
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install ethers@6
```

## Step 2: Rename Hardhat Config (if needed)

**Note:** If you have `hardhat.config.real.js`, rename it to `hardhat.config.cjs` (CommonJS extension required):

```bash
# Windows PowerShell
cd server
Rename-Item -Path hardhat.config.real.js -NewName hardhat.config.cjs

# Or if already named hardhat.config.js
Rename-Item -Path hardhat.config.js -NewName hardhat.config.cjs
```

**Why `.cjs`?** Your package.json has `"type": "module"` so all `.js` files are treated as ES modules. Hardhat config uses CommonJS syntax (`require()`), so it needs the `.cjs` extension.

## Step 3: Start Hardhat Network (Terminal 1)

```bash
cd server
npx hardhat node
```

**Keep this running!** You'll see:
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Copy these private keys!** You'll need them for MetaMask.

## Step 4: Deploy Smart Contract (Terminal 2)

```bash
cd server
npx hardhat run scripts/deploy-contract.js --network localhost
```

You'll see:
```
✅ ItemTradingNFT deployed successfully!
📋 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

⚠️ IMPORTANT: Add this to your .env file:
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Add CONTRACT_ADDRESS to your `.env` file!**

## Step 5: Configure MetaMask

### Add Hardhat Network:
1. Open MetaMask
2. Networks dropdown → **Add Network** → **Add Network Manually**
3. Fill in:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
4. Click **Save**

### Import Test Accounts:
1. MetaMask → **Import Account**
2. Paste **Private Key from Account #0** (from Step 3)
3. Repeat for Account #1

You should now see **10000 ETH** in each account!

## Step 6: Update Database - Add Wallet Addresses

Run these SQL commands to link your users to test wallets:

```sql
-- Update your first user with Account #0
UPDATE users 
SET walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
WHERE username = 'your_first_username';

-- Update your second user with Account #1
UPDATE users 
SET walletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
WHERE username = 'your_second_username';
```

Or do it via Node:
```javascript
const db = require('./src/models');

db.User.update(
  { walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
  { where: { username: 'your_first_username' } }
);
```

## Step 7: Update server.js to Initialize Blockchain

Add this to `server/src/server.js`:

```javascript
const blockchainService = require('./services/HardhatBlockchainService');

// After database sync
db.sequelize.sync().then(() => {
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Initialize blockchain service
    await blockchainService.initialize();
  });
});
```

## Step 8: Update MarketController to Use Blockchain

Add to `server/src/controllers/MarketController.js`:

```javascript
const blockchainService = require('../services/HardhatBlockchainService');

// In buyListing function, AFTER successful database swap:

// Log trade to database (always)
await db.TradeLog.create({
  itemHash: sellerItem.itemHash,
  fromUser: listing.User.username,
  toUser: buyer.username,
  toInventoryId: buyerInventoryId,
  listingId: listingId,
  transactionType: 'TRADE',
  status: 'CONFIRMED'
});

// Execute on blockchain (if enabled)
if (blockchainService.isEnabled() && 
    listing.User.walletAddress && 
    buyer.walletAddress) {
  try {
    await blockchainService.executeTrade(
      sellerItem.itemHash,
      null, // No item swap, just purchase
      listing.User.walletAddress,
      buyer.walletAddress,
      listingId,
      listing.User.username,
      buyer.username
    );
    console.log('✅ Blockchain trade completed');
  } catch (blockchainError) {
    console.error('⚠️ Blockchain trade failed:', blockchainError.message);
    // Database trade still succeeded
  }
}
```

## Step 9: Start Your Server (Terminal 3)

```bash
cd server
npm start
```

You should see:
```
Server is running on port 3000
✅ Hardhat blockchain service initialized
   Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Step 10: Test Everything

### Run the test script:
```bash
node scripts/test-blockchain.js
```

This will:
1. Connect to database
2. Initialize blockchain
3. Mint an NFT
4. Create a listing
5. Execute a trade on blockchain
6. Log everything to `trade_log` table
7. Verify the results

### Or test manually in browser:
1. Start frontend: `cd client && npm run dev`
2. Open browser, connect MetaMask (should show Hardhat Local network)
3. Login as user 1
4. Create a listing in Shop
5. Switch MetaMask to Account #1
6. Login as user 2
7. Buy the listing
8. Check `trade_log` table:
   ```sql
   SELECT * FROM trade_log ORDER BY traded_at DESC LIMIT 1;
   ```

You should see a record with:
- `transaction_hash`: Ethereum TX hash
- `block_number`: Block number
- `from_wallet` / `to_wallet`: MetaMask addresses
- `status`: CONFIRMED

## Verification

### Check blockchain transaction:
```bash
npx hardhat console --network localhost
```

```javascript
const tx = await ethers.provider.getTransaction('YOUR_TX_HASH');
console.log(tx);
```

### Check trade_log table:
```sql
SELECT 
  trade_id,
  from_user,
  to_user,
  LEFT(transaction_hash, 10) as tx_hash,
  status,
  block_number,
  gas_used,
  traded_at
FROM trade_log
ORDER BY traded_at DESC
LIMIT 5;
```

## Troubleshooting

**"Cannot connect to Hardhat"**
→ Make sure `npx hardhat node` is running in Terminal 1

**"Contract not deployed"**
→ Run `npx hardhat run scripts/deploy-contract.js --network localhost`

**"Nonce too high" in MetaMask**
→ Settings → Advanced → Clear activity tab data

**"execution reverted"**
→ Make sure item is minted first (the code handles this automatically)

## What's Happening?

1. **Hardhat**: Runs a local Ethereum blockchain at http://127.0.0.1:8545
2. **MetaMask**: Connects to this local blockchain
3. **Smart Contract**: Deployed on Hardhat, handles NFT minting and trading
4. **Backend**: Calls contract functions, records everything in `trade_log` table
5. **Database**: Has complete audit trail with blockchain TX hashes

Every trade is recorded in **both places**:
- On Hardhat blockchain (immutable, verifiable)
- In MySQL `trade_log` table (fast queries, user info)

## Next Steps

- Add trade history page in frontend
- Show transaction links (to local block explorer)
- Add NFT metadata endpoint
- Deploy to Sepolia testnet (for real testing)
