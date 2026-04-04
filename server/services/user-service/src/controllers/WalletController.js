import walletService from '../services/walletService.js';

const WalletController = {
  // POST /api/user/wallet/challenge
  // Body: { username }
  async createChallenge(req, res) {
    try {
      const result = await walletService.createChallenge(req.body);
      return res.json(result);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error('❌ createChallenge error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  },

  // POST /api/user/wallet/verify
  // Body: { username, address, signature }
  async verifySignatureAndSave(req, res) {
    try {
      const result = await walletService.verifySignatureAndSave(req.body);
      return res.json(result);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error('❌ verifySignatureAndSave error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
};

export default WalletController;
