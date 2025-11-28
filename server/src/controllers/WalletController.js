import { ethers } from 'ethers';
import db from '../models/index.js';

// In-memory challenge store: username -> nonce
const challenges = new Map();

const WalletController = {
  // POST /api/user/wallet/challenge
  // Body: { username }
  async createChallenge(req, res) {
    try {
      const { username } = req.body;
      console.log('🔐 Challenge requested for user:', username);
      if (!username) return res.status(400).json({ error: 'username required' });

      const nonce = Math.floor(Math.random() * 1e10).toString();
      challenges.set(username, nonce);

      const message = `Link wallet to user ${username} - nonce: ${nonce}`;
      console.log('✅ Challenge created:', message);
      return res.json({ message, nonce });
    } catch (err) {
      console.error('❌ createChallenge error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  },

  // POST /api/user/wallet/verify
  // Body: { username, address, signature }
  async verifySignatureAndSave(req, res) {
    try {
      const { username, address, signature } = req.body;
      console.log('🔐 Verify signature for user:', username, 'address:', address);
      if (!username || !address || !signature) return res.status(400).json({ error: 'username, address and signature required' });

      const nonce = challenges.get(username);
      if (!nonce) {
        console.log('❌ No challenge found for user:', username);
        return res.status(400).json({ error: 'no challenge for this user' });
      }

      const message = `Link wallet to user ${username} - nonce: ${nonce}`;
      console.log('🔍 Verifying message:', message);

      let recovered;
      try {
        recovered = ethers.verifyMessage(message, signature);
        console.log('🔑 Recovered address:', recovered);
      } catch (e) {
        console.error('❌ Invalid signature:', e.message);
        return res.status(400).json({ error: 'invalid signature' });
      }

      if (recovered.toLowerCase() !== address.toLowerCase()) {
        console.error('❌ Address mismatch - recovered:', recovered, 'claimed:', address);
        return res.status(400).json({ error: 'signature does not match address' });
      }

      // Update user's walletAddress in DB
      console.log('💾 Updating database for user:', username, 'wallet:', address);
      const [updated] = await db.User.update(
        { walletAddress: address },
        { where: { username } }
      );

      challenges.delete(username);

      if (updated === 0) {
        console.error('❌ User not found in database:', username);
        return res.status(404).json({ error: 'user not found' });
      }

      console.log('✅ Wallet linked successfully for user:', username, 'wallet:', address);
      return res.json({ success: true, walletAddress: address });
    } catch (err) {
      console.error('❌ verifySignatureAndSave error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
};

export default WalletController;
