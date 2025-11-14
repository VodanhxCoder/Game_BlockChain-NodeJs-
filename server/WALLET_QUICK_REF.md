# 🚀 Quick Reference - Wallet Linking with Sequelize

## One-Line Commands

```bash
# 1. Run migration (first time setup)
node run-wallet-migration.cjs

# 2. Link a wallet
node manage-wallets.cjs link username 0xWALLET_ADDRESS

# 3. List all wallets
node manage-wallets.cjs list

# 4. Verify user wallet
node manage-wallets.cjs verify username

# 5. Unlink wallet
node manage-wallets.cjs unlink username

# 6. Bulk link from JSON
node manage-wallets.cjs bulk wallets.json
```

## Quick Setup for Trading

```bash
# Step 1: Ensure migration is done
cd server
node run-wallet-migration.cjs

# Step 2: Link seller's wallet
node manage-wallets.cjs link seller_user 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Step 3: Link buyer's wallet  
node manage-wallets.cjs link buyer_user 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

# Step 4: Verify both users
node manage-wallets.cjs verify seller_user
node manage-wallets.cjs verify buyer_user

# ✅ Ready to trade!
```

## Test with Hardhat Accounts

```bash
# Link 3 test users to Hardhat accounts
node manage-wallets.cjs link alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
node manage-wallets.cjs link bob 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
node manage-wallets.cjs link charlie 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

# Verify all linked
node manage-wallets.cjs list
```

## Programmatic Usage (in your code)

```javascript
const db = require('./src/models');

// Link wallet
const user = await db.User.findOne({ where: { username: 'alice' } });
await user.update({ walletAddress: '0x...' });

// Get user's wallet
const user = await db.User.findOne({ 
  where: { username: 'alice' },
  attributes: ['walletAddress'] 
});
console.log(user.walletAddress);

// Find user by wallet
const user = await db.User.findOne({ 
  where: { walletAddress: '0x...' } 
});

// Check if user has wallet
const hasWallet = user && user.walletAddress !== null;
```

## SQL Queries

```sql
-- Link wallet
UPDATE users SET walletAddress = '0x...' WHERE username = 'alice';

-- Check wallet
SELECT walletAddress FROM users WHERE username = 'alice';

-- List all wallets
SELECT username, walletAddress FROM users WHERE walletAddress IS NOT NULL;

-- Unlink wallet
UPDATE users SET walletAddress = NULL WHERE username = 'alice';
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| Column doesn't exist | Run: `node run-wallet-migration.cjs` |
| Wallet already linked | Run: `node manage-wallets.cjs unlink other_user` first |
| Invalid address format | Use format: `0x` + 40 hex chars |
| User not found | Check username exists in database |
| Database connection failed | Verify `.env` credentials |

## Files Created

- `manage-wallets.cjs` - Main CLI tool (link/unlink/list/verify/bulk)
- `run-wallet-migration.cjs` - Migration runner with stats
- `wallets.example.json` - Example bulk link file
- `WALLET_MANAGEMENT.md` - Complete documentation

## Migration Details

- **Column:** `walletAddress`
- **Type:** VARCHAR(66)
- **Nullable:** YES
- **Unique:** YES (one wallet per user)
- **Format:** 0x + 40 hex characters

---

**✅ Everything you need to link wallets using Sequelize!**
