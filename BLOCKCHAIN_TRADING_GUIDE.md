# Blockchain Trading with MetaMask - Implementation Guide

## 🎯 What's Been Implemented

Your marketplace now uses **blockchain smart contracts** for all trades! When a user buys an item:

1. **Prepare Phase**: Backend generates contract calldata (encodes the trade parameters)
2. **MetaMask Transaction**: User confirms the transaction in MetaMask
3. **Blockchain Execution**: Trade is recorded on the Hardhat blockchain
4. **Database Sync**: Backend updates inventory and logs the trade with transaction hash

## 🔄 Trading Flow

```
User clicks "Trade" 
    ↓
Frontend: POST /api/market/prepare-trade
    ↓ 
Backend: Generate contract calldata with seller/buyer item hashes and wallet addresses
    ↓
Frontend: Send transaction via MetaMask (window.ethereum.request)
    ↓
MetaMask: User confirms transaction
    ↓
Blockchain: Transaction mined on Hardhat network
    ↓
Frontend: POST /api/market/confirm-trade with txHash
    ↓
Backend: Fetch receipt, swap items in DB, create TradeLog entry
    ↓
Success! ✅
```

## 📋 Prerequisites

### 1. Hardhat Network Running
```bash
cd server
npx hardhat node
```

Keep this running! You should see test accounts like:
```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
```

### 2. Smart Contract Deployed
```bash
cd server
npx hardhat run scripts/deploy-contract.js --network localhost
```

Copy the contract address and add to `.env`:
```env
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. MetaMask Configured

**Add Hardhat Network:**
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

**Import Test Accounts:**
Import the private keys from the Hardhat node output (Account #0 and Account #1).

### 4. Link User Wallets to Database

**⚠️ CRITICAL: Both seller and buyer MUST have their wallets linked to enable blockchain trading!**

The marketplace will show "⚠️ Seller wallet not connected" and disable the Trade button if the seller hasn't linked their wallet.

**Option A: Use the Quick Link Script (Recommended)**
```bash
cd server
node link-wallet.cjs username walletAddress
```

Examples:
```bash
# Link user1 to Hardhat Account #0
node link-wallet.cjs user1 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Link user2 to Hardhat Account #1
node link-wallet.cjs user2 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

**Option B: Manual SQL Update**
```sql
UPDATE users 
SET walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
WHERE username = 'your_first_username';

UPDATE users 
SET walletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
WHERE username = 'your_second_username';
```

**Option C: Use the Wallet Linking Feature (Auto-link on first connect)**
1. Login as user
2. Connect MetaMask wallet
3. The app automatically links the wallet to your account via signature verification

**Verify wallet is linked:**
```sql
SELECT username, walletAddress FROM users WHERE walletAddress IS NOT NULL;
```

## 🧪 Testing the Blockchain Trade

### Scenario: User1 sells to User2

**Step 1: Setup**
- User1 creates a listing in the marketplace
- User2 has an item in their inventory to trade

**Step 2: Login as Seller (User1)**
- Login to the app
- Connect MetaMask (select Account #0)
- Create a listing in Shop → Marketplace

**Step 3: Login as Buyer (User2) in Incognito Window**
- Open browser in incognito mode (separate session)
- Login as User2
- Connect MetaMask (select Account #1)

**Step 4: Execute Trade**
- In User2's window, click "Trade" on User1's listing
- Select an item from your inventory
- Click "Confirm trade"

**What happens next:**
1. ✅ Console shows: "🔄 Starting blockchain trade..."
2. ✅ Console shows: "📡 Preparing trade transaction..."
3. 🦊 **MetaMask popup appears** asking to confirm transaction
4. ✅ User confirms in MetaMask
5. ✅ Alert: "Transaction submitted! Hash: 0x..."
6. ✅ Backend fetches receipt and updates database
7. ✅ Alert: "Trade successful! Check your inventory."

## 🔍 Verification

### Check Browser Console
```javascript
// You should see:
🔄 Starting blockchain trade...
📡 Preparing trade transaction...
✅ Trade prepared: {contractAddress: "0x5FbDB...", sellerItemHash: "abc123...", buyerItemHash: "def456..."}
🦊 Requesting MetaMask transaction...
✅ Transaction sent: 0x789abc...
📡 Confirming trade in database...
✅ Trade completed successfully!
```

### Check Backend Logs
```
✅ Trade prepared for listing 123
✅ Transaction confirmed: 0x789abc...
✅ Trade logged to database (trade_id: 45)
```

### Check Database
```sql
SELECT * FROM trade_log ORDER BY traded_at DESC LIMIT 1;
```

You should see:
- `transaction_hash`: The blockchain TX hash (0x...)
- `block_number`: Block number on Hardhat
- `gas_used`: Gas consumed
- `from_wallet`: Buyer's wallet address
- `to_wallet`: Contract address
- `status`: CONFIRMED

### Check Blockchain
```bash
# In Hardhat console
npx hardhat console --network localhost
```

```javascript
const tx = await ethers.provider.getTransaction('YOUR_TX_HASH');
console.log(tx);
```

## 🐛 Troubleshooting

### "Seller wallet address not found" or "⚠️ Seller wallet not connected"
→ The seller hasn't linked their wallet to their account. 

**Fix:**
```bash
cd server
node link-wallet.cjs seller_username 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Or have the seller:
1. Login to the app
2. Connect their MetaMask wallet
3. The wallet will be automatically linked via signature verification

### "Buyer wallet not connected"
→ The buyer needs to connect MetaMask before trading. Click the "Connect Wallet" button in the marketplace.

### "MetaMask not installed"
→ Install MetaMask browser extension

### "Transaction rejected by user"
→ User clicked "Reject" in MetaMask popup

### "Cannot connect to Hardhat"
→ Make sure `npx hardhat node` is running in Terminal 1

### "Nonce too high" in MetaMask
→ MetaMask → Settings → Advanced → Clear activity tab data

### "execution reverted" in transaction
→ Check that:
- Items are properly minted on the blockchain
- Wallet addresses are correct
- Contract is deployed

## 📊 What Gets Logged

Every trade creates a `TradeLog` entry with:

```javascript
{
  tradeId: 45,
  itemHash: "abc123...",
  fromUser: "user1",
  toUser: "user2",
  transactionHash: "0x789abc...",
  transactionType: "TRADE",
  status: "CONFIRMED",
  blockNumber: 12345,
  gasUsed: "65432",
  fromWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  toWallet: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  listingId: 123,
  tradedAt: "2025-11-14 10:30:00"
}
```

## 🚀 Next Steps

- [ ] Add trade history page showing blockchain transactions
- [ ] Display transaction links in UI
- [ ] Add loading states during MetaMask confirmation
- [ ] Handle pending transactions (show spinner while mining)
- [ ] Add gas estimation before transaction
- [ ] Deploy to Sepolia testnet for real testing
- [ ] Add event listeners for blockchain events (TradeExecuted)

## 💡 Key Files Modified

### Backend
- `server/src/controllers/TradeController.js` - Prepare and confirm blockchain trades
- `server/src/controllers/MarketController.js` - Added TradeLog creation
- `server/src/routes/market.js` - Added prepare-trade and confirm-trade endpoints

### Frontend
- `client/src/pages/User/Shop/Shop.jsx` - MetaMask transaction flow
- `client/src/context/Web3Context.jsx` - Wallet linking with signature verification

### Database
- `trade_log` table stores all blockchain transaction details
- `users.walletAddress` links user accounts to blockchain addresses

## 🔐 Security Notes

- Wallet linking uses challenge-response authentication (nonce + signature)
- Each user can only connect one wallet address
- MetaMask account changes are validated against saved wallet
- All trades require both database AND blockchain confirmation
- Transaction receipts are verified before updating database

## 📝 Example Test Output

```
=== Test Blockchain Trade ===

✅ User1 (seller) connected: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
✅ User2 (buyer) connected: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✅ Listing created: ID 123
✅ MetaMask transaction confirmed
✅ Transaction hash: 0x123abc...
✅ Block number: 45
✅ Gas used: 65432
✅ Trade logged to database
✅ Items swapped in inventory
✅ Listing removed from marketplace

Total time: 3.2 seconds
```

---

**🎉 Congratulations!** Your marketplace now has full blockchain integration with MetaMask confirmation!
