# Wallet Linking Implementation Guide

## Overview
This implementation ensures that different user accounts connect to different MetaMask wallets across multiple browser windows, with wallet addresses saved in the database.

## How It Works

### 1. **User Login Flow**
- When a user logs in, the backend returns their saved `walletAddress` (if they have one)
- The client stores this in the user context

### 2. **Wallet Connection Flow**

#### Case 1: User has NO saved wallet
1. User clicks "Connect Wallet" in MetaMask
2. MetaMask prompts for account selection
3. After connection, the wallet address is automatically linked to the user account via challenge-sign-verify
4. Backend saves the wallet address to the database

#### Case 2: User has a saved wallet
1. User clicks "Connect Wallet"
2. System checks if the selected MetaMask account matches the saved wallet
3. **If mismatch**: Alert prompts user to switch to the correct account in MetaMask
4. **If match**: Connection proceeds normally

### 3. **Multi-Window Behavior**

**Scenario**: User A logs in on Window 1, User B logs in on Window 2

- **Window 1**: User A's MetaMask connects to their saved wallet (or links a new one)
- **Window 2**: User B's MetaMask connects to their saved wallet (or links a new one)
- Each window maintains its own wallet connection tied to the logged-in user
- Wallet addresses are persisted in the database per user

## Database Schema

### Users Table
```sql
ALTER TABLE users ADD COLUMN walletAddress VARCHAR(66) UNIQUE;
```

Migration file: `server/src/migrations/20251114150000-add-wallet-address-to-users.js`

Run migration:
```bash
cd server
npx sequelize-cli db:migrate
```

## API Endpoints

### POST /api/user/wallet/challenge
**Request:**
```json
{
  "username": "user123"
}
```

**Response:**
```json
{
  "message": "Link wallet to user user123 - nonce: 1234567890",
  "nonce": "1234567890"
}
```

### POST /api/user/wallet/verify
**Request:**
```json
{
  "username": "user123",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

## Client-Side Usage

### Using Web3Context
```jsx
import { useWeb3 } from './context/Web3Context';
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { connectWallet, account, linkWalletToUser } = useWeb3();
  const { user } = useAuth();

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success) {
      console.log('Connected to:', account);
      if (user) {
        console.log('User wallet:', user.walletAddress);
      }
    }
  };

  return (
    <div>
      <button onClick={handleConnect}>Connect Wallet</button>
      {user?.walletAddress && (
        <p>Linked wallet: {user.walletAddress}</p>
      )}
    </div>
  );
}
```

## Security Features

1. **Challenge-Response Authentication**
   - Backend generates a unique nonce for each wallet linking request
   - User signs the message with their private key
   - Backend verifies the signature matches the claimed address

2. **One Wallet Per User**
   - Database constraint ensures `walletAddress` is unique
   - Users cannot link the same wallet to multiple accounts

3. **Wallet Mismatch Detection**
   - If user tries to connect a different wallet than saved, they get a warning
   - Prevents accidental cross-account wallet usage

## Testing Multi-Window Scenario

1. **Setup Hardhat with multiple accounts:**
```bash
cd server
npx hardhat node
# Note the test accounts printed (Account #0, #1, etc.)
```

2. **Import accounts into MetaMask:**
   - Add Account #0 private key to MetaMask
   - Add Account #1 private key to MetaMask (separate account)

3. **Test in two browser windows:**
   - Window 1: Login as User A → Connect to MetaMask Account #0
   - Window 2: Login as User B → Connect to MetaMask Account #1

4. **Verify database:**
```sql
SELECT username, walletAddress FROM users;
```

Expected result:
```
username | walletAddress
---------|-------------------------------------------
userA    | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
userB    | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

## Troubleshooting

### "Please switch MetaMask to the linked wallet" error
- User is trying to connect with a different MetaMask account than saved
- Solution: Switch MetaMask to the correct account or unlink wallet in settings

### Wallet link fails
- Check that backend server is running
- Verify migration has been run
- Check browser console for errors
- Ensure MetaMask is unlocked

### Same wallet across multiple windows
- This happens if the same user logs in on both windows
- Each user account can only have ONE linked wallet
- To test multi-wallet, use different user accounts

## Code Files Modified

### Client
- `client/src/context/AuthContext.jsx` - Added walletAddress to user object
- `client/src/context/Web3Context.jsx` - Added wallet linking and mismatch detection

### Server
- `server/src/models/User.js` - Added walletAddress field
- `server/src/routes/auth.js` - Return walletAddress in login response
- `server/src/controllers/WalletController.js` - Challenge-sign-verify logic
- `server/src/migrations/20251114150000-add-wallet-address-to-users.js` - Database migration

## Next Steps

1. Run the migration to add `walletAddress` column
2. Start backend server
3. Start Hardhat node
4. Deploy contract (if using blockchain features)
5. Test wallet linking with different accounts
6. Implement UI to display/manage linked wallets
