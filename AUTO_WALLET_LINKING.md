# 🔗 Automatic Wallet Linking - How It Works

## Overview

When you click "Connect Wallet" on any page, your MetaMask wallet is **automatically linked** to your user account using a secure signature-based authentication process.

---

## 🚀 User Experience Flow

### Step 1: Login to Your Account
```
1. Login with your username and password
2. Navigate to any page with the "Connect Wallet" button
```

### Step 2: Click "Connect MetaMask"
```
1. Click the "Connect MetaMask" button
2. MetaMask popup appears asking to connect
3. Select your account and click "Connect"
```

### Step 3: Sign the Message (Auto-Linking)
```
1. After connecting, another MetaMask popup appears
2. Message: "Please sign to verify wallet ownership"
3. Click "Sign" (this is FREE - no gas fees!)
4. ✅ Wallet automatically linked to your account!
```

### Step 4: Confirmation
```
You'll see an alert:
"✅ Wallet linked successfully!
Your wallet 0xf39Fd6e51... is now linked to username"
```

---

## 🔒 How It Works (Technical)

### 1. Challenge-Response Authentication

```javascript
// Backend generates a unique challenge
const nonce = Math.random().toString(36);
const message = `Sign this message to verify wallet ownership: ${nonce}`;
```

### 2. User Signs the Message

```javascript
// Frontend requests signature from MetaMask
const signature = await signer.signMessage(message);
// No transaction, no gas fees - just a cryptographic signature
```

### 3. Backend Verifies Signature

```javascript
// Backend recovers the address from signature
const recoveredAddress = ethers.verifyMessage(message, signature);

// If recovered address matches wallet, link it to user
if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
  await User.update({ walletAddress }, { where: { username } });
}
```

---

## 🎯 What Gets Linked

After automatic linking, your database will have:

```sql
-- Example after linking
SELECT username, walletAddress FROM users WHERE username = 'alice';

-- Result:
username | walletAddress
---------|------------------------------------------
alice    | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

---

## 💡 Key Features

### ✅ Automatic
- No manual setup required
- Links on first wallet connection
- Works immediately after connecting

### 🔒 Secure
- Uses cryptographic signatures
- Challenge-response prevents replay attacks
- No private keys ever shared

### 💰 Free
- Signing is completely FREE
- No gas fees for linking
- Only blockchain transactions cost gas

### 🔄 One Wallet Per User
- Each user can only have ONE linked wallet
- Prevents wallet sharing/abuse
- Unique constraint enforced in database

### 🛡️ Protected Trading
- Only users with linked wallets can trade
- Seller and buyer must both have wallets linked
- Automatic validation before transactions

---

## 📱 Visual Indicators

### Before Linking (Not Connected)
```
┌─────────────────────────────────────────┐
│          🦊                             │
│   Connect Your MetaMask Wallet          │
│                                         │
│ Link your wallet to trade items on     │
│ the blockchain                          │
│                                         │
│ 💡 Your wallet will be automatically   │
│    linked to your account (alice)      │
│                                         │
│    [  Connect MetaMask  ]               │
└─────────────────────────────────────────┘
```

### After Linking (Connected)
```
┌─────────────────────────────────────────┐
│ ● Wallet Connected  [Linked to alice]  │
│ 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb9 │
│                                         │
│ Balance: 10000.0000 ETH                 │
│ Network: Hardhat Local                  │
└─────────────────────────────────────────┘
```

### Marketplace Listings
```
Seller: alice
⚠️ Seller wallet not connected  ← Won't appear after linking
```

---

## 🧪 Testing the Auto-Link

### Test Scenario: New User

1. **Create a test user:**
```bash
# Register in the app or insert to database
INSERT INTO users (username, email, password_hash, playername) 
VALUES ('testuser', 'test@example.com', 'hash...', 'Test User');
```

2. **Login as testuser**
```
Navigate to: http://localhost:5173/signin
Login with: testuser / password
```

3. **Connect Wallet**
```
Click: "Connect MetaMask"
MetaMask: Select Account #0 → Connect
MetaMask: Sign message (appears automatically)
Alert: "Wallet linked successfully!"
```

4. **Verify in Database**
```sql
SELECT username, walletAddress FROM users WHERE username = 'testuser';
-- Should show the linked wallet address
```

---

## 🔧 Troubleshooting

### Issue: "Failed to link wallet"

**Cause:** Backend couldn't verify signature

**Solution:**
1. Make sure backend is running
2. Check console for errors
3. Try disconnecting and reconnecting

### Issue: No signature popup appears

**Cause:** Auto-link code may not be running

**Solution:**
1. Check browser console for errors
2. Ensure you're logged in
3. Make sure `user.walletAddress` is null in database

### Issue: "Wallet is already linked to another user"

**Cause:** This wallet was previously linked

**Solution:**
```bash
# Unlink from previous user
cd server
node manage-wallets.cjs unlink previous_username

# Or link a different wallet to current user
```

### Issue: User already has a wallet linked

**Behavior:** Auto-link is skipped if `user.walletAddress` already exists

**To re-link:**
```bash
# Unlink first
node manage-wallets.cjs unlink username

# Then connect wallet again in the app
```

---

## 🎓 For Developers

### Where Auto-Link Happens

**File:** `client/src/context/Web3Context.jsx`

```javascript
// In connectWallet() function
if (user && !user.walletAddress) {
  console.log('🔗 Auto-linking wallet to user account...');
  alert('Please sign the message in MetaMask to link your wallet to your account.');
  await linkWalletToUser(selectedAccount, user.username);
  alert(`✅ Wallet linked successfully!`);
}
```

### Backend Endpoints Used

1. **POST** `/api/user/wallet/challenge`
   - Input: `{ username }`
   - Output: `{ message: "Sign this message..." }`

2. **POST** `/api/user/wallet/verify`
   - Input: `{ username, address, signature }`
   - Output: `{ success: true, user: {...} }`

### Database Model

```javascript
// models/User.js
walletAddress: {
  type: DataTypes.STRING(66),
  allowNull: true,
  unique: true,  // One wallet per user
  validate: {
    isValidAddress(value) {
      if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error('Invalid Ethereum address');
      }
    }
  }
}
```

---

## ✅ Summary

**Automatic wallet linking:**
- ✅ Happens on first "Connect Wallet" click
- ✅ Uses secure signature verification
- ✅ Completely free (no gas fees)
- ✅ One wallet per user (enforced)
- ✅ Required for blockchain trading
- ✅ Shows visual confirmation when linked

**No manual steps needed** - just login and connect wallet!
