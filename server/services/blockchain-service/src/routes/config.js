import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const router = express.Router();
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getContractAddress = () => process.env.CONTRACT_ADDRESS || process.env.BLOCKCHAIN_CONTRACT_ADDRESS || null;

const loadContractArtifact = () => {
  try {
    const artifactPath = path.resolve(__dirname, '../../../../artifacts/contracts/ItemTradingNFT.sol/ItemTradingNFT.json');
    return require(artifactPath);
  } catch (_error) {
    return null;
  }
};

// GET /api/config - returns public configuration like contract address
router.get('/config', (req, res) => {
  const contractAddress = getContractAddress();
  const artifact = loadContractArtifact();

  res.json({
    contractAddress,
    chainId: process.env.BLOCKCHAIN_CHAIN_ID || '31337',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    contractReady: !!contractAddress && !!artifact,
    tradeMethod: 'executeTradeByParticipants',
    abi: artifact?.abi || null
  });
});

// POST /blockchain-service/config/trade-payload
// Build encoded calldata for client-side MetaMask contract execution.
router.post('/config/trade-payload', (req, res) => {
  const {
    sellerItemHash,
    buyerItemHash,
    sellerWallet,
    buyerWallet,
    sellerSignature,
    listingId,
    sellerSignatureTimestamp,
    mode,
  } = req.body || {};

  const contractAddress = getContractAddress();
  const artifact = loadContractArtifact();
  if (!contractAddress || !artifact?.abi) {
    return res.status(500).json({
      error: 'Smart contract not configured',
      details: 'Set CONTRACT_ADDRESS (or BLOCKCHAIN_CONTRACT_ADDRESS) and compile/deploy ItemTradingNFT.',
    });
  }

  if (!sellerItemHash || !buyerItemHash || !sellerWallet || !buyerWallet) {
    return res.status(400).json({
      error: 'Missing required fields: sellerItemHash, buyerItemHash, sellerWallet, buyerWallet',
    });
  }

  const iface = new ethers.Interface(artifact.abi);
  const sellerHashBytes = sellerItemHash.startsWith('0x') ? sellerItemHash : `0x${sellerItemHash}`;
  const buyerHashBytes = buyerItemHash.startsWith('0x') ? buyerItemHash : `0x${buyerItemHash}`;

  try {
    const useParticipantsMode = mode === 'participants' || (sellerSignature && listingId && sellerSignatureTimestamp);
    let functionName = 'executeTrade';
    let data;

    if (useParticipantsMode) {
      if (!sellerSignature || listingId === undefined || sellerSignatureTimestamp === undefined) {
        return res.status(400).json({
          error: 'participants mode requires sellerSignature, listingId, sellerSignatureTimestamp',
        });
      }

      functionName = 'executeTradeByParticipants';
      data = iface.encodeFunctionData(functionName, [
        sellerHashBytes,
        buyerHashBytes,
        sellerWallet,
        buyerWallet,
        sellerSignature,
        Number(listingId),
        Number(sellerSignatureTimestamp),
      ]);
    } else {
      data = iface.encodeFunctionData(functionName, [
        sellerHashBytes,
        buyerHashBytes,
        sellerWallet,
        buyerWallet,
      ]);
    }

    return res.json({
      contractAddress,
      functionName,
      data,
      value: '0x0',
    });
  } catch (error) {
    return res.status(400).json({
      error: 'Failed to build trade payload',
      details: error.message,
    });
  }
});

export default router;
