# Wallet Management with Sequelize

Complete guide for linking MetaMask wallet addresses to user accounts using Sequelize ORM.

## 📋 Table of Contents

1. [Setup & Migration](#setup--migration)
2. [Managing Wallets](#managing-wallets)
3. [Programmatic Usage](#programmatic-usage)
4. [Troubleshooting](#troubleshooting)

---

## 🚀 Setup & Migration

### Step 1: Run the Migration

First, ensure the `walletAddress` column exists in your database:

```bash
cd server
node run-wallet-migration.cjs
```

**What this does:**
- ✅ Checks if `walletAddress` column exists
- ✅ Adds the column if missing (VARCHAR(66), NULL, UNIQUE)
- ✅ Shows database statistics (total users, linked wallets)
- ✅ Provides next steps

**Expected output:**
```
🔧 Running migration: add-wallet-address-to-users...

✅ Database connection established

✅ walletAddress column added successfully!
   Type: VARCHAR(66)
   Null: YES
   Unique: YES

📊 Database Statistics:
   Total users: 10
   Linked wallets: 0
   Unlinked: 10

✅ Migration completed successfully!
```

---

## 🔧 Managing Wallets

### Using the CLI Tool

The `manage-wallets.cjs` script provides a complete wallet management interface.

#### Link a Wallet

```bash
node manage-wallets.cjs link <username> <walletAddress>
```

**Example:**
```bash
node manage-wallets.cjs link alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Output:**
```
🔗 Linking wallet to user...

✅ Successfully linked wallet!
   Username: alice
   Wallet:   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

#### Unlink a Wallet

```bash
node manage-wallets.cjs unlink <username>
```

**Example:**
```bash
node manage-wallets.cjs unlink alice
```

#### List All Linked Wallets

```bash
node manage-wallets.cjs list
```

**Output:**
```
📋 Users with linked wallets:

   ┌─────────────────────────────────────────────────────────────────────────┐
   │  1. alice                0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 │
   │  2. bob                  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 │
   └─────────────────────────────────────────────────────────────────────────┘

   Total: 2 user(s) with linked wallets
```

#### Verify User's Wallet

```bash
node manage-wallets.cjs verify <username>
```

**Example:**
```bash
node manage-wallets.cjs verify alice
```

**Output:**
```
🔍 Verifying wallet for user "alice"...

   User Information:
   ├─ Username:    alice
   ├─ Player Name: Alice Wonder
   ├─ Email:       alice@example.com
   ├─ Created:     2025-11-01 10:30:00
   └─ Wallet:      0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

✅ Wallet is linked!
```

#### Bulk Link Wallets

Create a JSON file with wallet mappings:

**wallets.json:**
```json
[
  {"username": "alice", "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
  {"username": "bob", "walletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"},
  {"username": "charlie", "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}
]
```

Then run:
```bash
node manage-wallets.cjs bulk wallets.json
```

**Output:**
```
📦 Bulk linking wallets from wallets.json...

🔗 Linking wallet to user...
✅ Successfully linked wallet!
   Username: alice
   Wallet:   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

🔗 Linking wallet to user...
✅ Successfully linked wallet!
   Username: bob
   Wallet:   0x70997970C51812dc3A010C7d01b50e0d17dc79C8

📊 Bulk link completed:
   ✅ Success: 2
   ❌ Failed:  0
```

---

## 💻 Programmatic Usage

### Using Sequelize Models Directly

```javascript
const db = require('./src/models');

// Link wallet to user
async function linkWallet(username, walletAddress) {
  const user = await db.User.findOne({ where: { username } });
  if (!user) {
    throw new Error('User not found');
  }
  
  await user.update({ walletAddress });
  console.log('Wallet linked!');
}

// Get user with wallet
async function getUserWallet(username) {
  const user = await db.User.findOne({
    where: { username },
    attributes: ['username', 'walletAddress']
  });
  return user ? user.walletAddress : null;
}

// Find user by wallet address
async function findUserByWallet(walletAddress) {
  const user = await db.User.findOne({
    where: { walletAddress },
    attributes: ['username', 'email', 'walletAddress']
  });
  return user;
}

// List all users with wallets
async function listUsersWithWallets() {
  const users = await db.User.findAll({
    where: {
      walletAddress: { [db.Sequelize.Op.ne]: null }
    },
    attributes: ['username', 'walletAddress'],
    order: [['username', 'ASC']]
  });
  return users;
}
```

### Using in API Endpoints

**Example: Get user's wallet address**
```javascript
// In your controller
const getUserWallet = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await db.User.findOne({
      where: { username },
      attributes: ['username', 'walletAddress']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      username: user.username,
      walletAddress: user.walletAddress || null,
      hasWallet: !!user.walletAddress
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
```

### Validation Example

```javascript
// Validate Ethereum address format
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Middleware to check wallet linkage
const requireLinkedWallet = async (req, res, next) => {
  try {
    const username = req.user?.username; // from auth middleware
    
    const user = await db.User.findOne({
      where: { username },
      attributes: ['walletAddress']
    });
    
    if (!user || !user.walletAddress) {
      return res.status(403).json({
        error: 'Wallet not linked',
        message: 'Please connect your wallet to proceed'
      });
    }
    
    req.userWallet = user.walletAddress;
    next();
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
```

---

## 🔍 Database Queries

### SQL Queries for Direct Database Access

**Check if user has wallet:**
```sql
SELECT username, walletAddress 
FROM users 
WHERE username = 'alice';
```

**List all users with wallets:**
```sql
SELECT username, walletAddress, createdAt
FROM users
WHERE walletAddress IS NOT NULL
ORDER BY username;
```

**Count users with/without wallets:**
```sql
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN walletAddress IS NOT NULL THEN 1 ELSE 0 END) as linked,
  SUM(CASE WHEN walletAddress IS NULL THEN 1 ELSE 0 END) as unlinked
FROM users;
```

**Find user by wallet:**
```sql
SELECT username, email, walletAddress
FROM users
WHERE walletAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "walletAddress column does not exist"

**Solution:** Run the migration first
```bash
node run-wallet-migration.cjs
```

#### 2. "Wallet is already linked to another user"

**Cause:** Each wallet can only be linked to one user (UNIQUE constraint)

**Solution:** Unlink the wallet from the other user first
```bash
node manage-wallets.cjs unlink other_username
node manage-wallets.cjs link new_username 0x...
```

#### 3. "Invalid wallet address format"

**Cause:** Wallet address must be 0x followed by 40 hex characters

**Valid format:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Invalid:** `f39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (missing 0x)

#### 4. "User not found in database"

**Cause:** Username doesn't exist in the `users` table

**Solution:** Create the user first or verify the username
```bash
node manage-wallets.cjs list  # Check existing users
```

#### 5. Database connection errors

**Cause:** Missing or incorrect database credentials

**Solution:** Check your `.env` file:
```env
DB_NAME=your_database
DB_USER=your_username
DB_PASS=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

---

## 📚 Reference

### Hardhat Test Accounts

When using Hardhat local network, these are the default test accounts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
```

### Database Schema

```sql
CREATE TABLE users (
  username VARCHAR(50) PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(1024) NOT NULL,
  playername VARCHAR(100),
  walletAddress VARCHAR(66) UNIQUE,  -- Added by migration
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

### Sequelize Model

```javascript
walletAddress: {
  type: DataTypes.STRING(66),
  allowNull: true,
  unique: true,
  field: 'walletAddress',
  validate: {
    isValidAddress(value) {
      if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error('Invalid Ethereum address format');
      }
    }
  }
}
```

---

## 🎯 Quick Start Examples

### Example 1: Link test users to Hardhat accounts

```bash
cd server
node manage-wallets.cjs link alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
node manage-wallets.cjs link bob 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
node manage-wallets.cjs list
```

### Example 2: Verify before trading

```bash
node manage-wallets.cjs verify seller_username
node manage-wallets.cjs verify buyer_username
```

### Example 3: Bulk setup for testing

```bash
# Create wallets.json with your test users
node manage-wallets.cjs bulk wallets.json
node manage-wallets.cjs list
```

---

## 📝 Notes

- **Unique Constraint:** Each wallet can only be linked to ONE user
- **Nullable:** Users can exist without linked wallets
- **Case Sensitive:** Wallet addresses are case-sensitive (use checksummed format)
- **Validation:** Addresses are validated on both client and server
- **Auto-linking:** The app can auto-link wallets when users first connect MetaMask

---

**✅ You're all set!** Your database now supports wallet linking with full Sequelize integration.
