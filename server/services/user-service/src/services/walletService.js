import { ethers } from 'ethers';
import db from '../../../shared/models/index.js';
import { Op } from 'sequelize';

const challenges = new Map();

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const createChallenge = async ({ username }) => {
  if (!username) {
    throw createHttpError(400, 'username required');
  }

  const nonce = Math.floor(Math.random() * 1e10).toString();
  challenges.set(username, nonce);

  const message = `Link wallet to user ${username} - nonce: ${nonce}`;
  return { message, nonce };
};

const verifySignatureAndSave = async ({ username, address, signature }) => {
  if (!username || !address || !signature) {
    throw createHttpError(400, 'username, address and signature required');
  }

  const nonce = challenges.get(username);
  if (!nonce) {
    throw createHttpError(400, 'no challenge for this user');
  }

  const message = `Link wallet to user ${username} - nonce: ${nonce}`;

  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (error) {
    throw createHttpError(400, 'invalid signature');
  }

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    throw createHttpError(400, 'signature does not match address');
  }

  const existingUser = await db.User.findOne({
    where: {
      walletAddress: address,
      username: { [Op.ne]: username },
    },
  });

  if (existingUser) {
    challenges.delete(username);
    throw createHttpError(409, 'This wallet is already linked to another account. Please use a different wallet.');
  }

  const [updated] = await db.User.update(
    { walletAddress: address },
    { where: { username } }
  );

  challenges.delete(username);

  if (updated === 0) {
    throw createHttpError(404, 'user not found');
  }

  return { success: true, walletAddress: address };
};

export default {
  createChallenge,
  verifySignatureAndSave,
};
