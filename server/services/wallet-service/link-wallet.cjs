/**
 * Quick script to manually link wallet addresses to user accounts
 * Usage: node services/wallet-service/link-wallet.cjs username walletAddress
 * Example: node services/wallet-service/link-wallet.cjs alice 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 */

const db = require('../../src/models');

async function linkWallet(username, walletAddress) {
	try {
		console.log(`Linking wallet ${walletAddress} to user ${username}...`);

		if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
			console.error('Invalid wallet address format. Must be 0x followed by 40 hex characters.');
			process.exit(1);
		}

		const user = await db.User.findOne({ where: { username } });
		if (!user) {
			console.error(`User ${username} not found in database.`);
			process.exit(1);
		}

		const existing = await db.User.findOne({ where: { walletAddress } });
		if (existing && existing.username !== username) {
			console.error(`Wallet ${walletAddress} is already linked to user ${existing.username}.`);
			process.exit(1);
		}

		await db.User.update(
			{ walletAddress },
			{ where: { username } }
		);

		console.log(`Successfully linked wallet to ${username}.`);
		console.log(`Username: ${username}`);
		console.log(`Wallet: ${walletAddress}`);

		process.exit(0);
	} catch (error) {
		console.error('Error linking wallet:', error.message);
		process.exit(1);
	}
}

const args = process.argv.slice(2);
if (args.length !== 2) {
	console.log('Usage: node services/wallet-service/link-wallet.cjs <username> <walletAddress>');
	process.exit(1);
}

const [username, walletAddress] = args;
linkWallet(username, walletAddress);