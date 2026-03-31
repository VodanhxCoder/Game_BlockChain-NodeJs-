import express from 'express';

const router = express.Router();

// GET /api/config - returns public configuration like contract address
router.get('/config', (req, res) => {
  res.json({
    contractAddress: process.env.CONTRACT_ADDRESS,
    chainId: process.env.BLOCKCHAIN_CHAIN_ID || '31337',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545'
  });
});

export default router;
