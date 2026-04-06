/**
 * Comprehensive wallet linking tool using Sequelize
 * Supports multiple operations: link, unlink, list, verify
 * Usage: node services/wallet-service/manage-wallets.cjs <command> [args]
 */

const db = require('../../src/models');
const { Sequelize } = require('sequelize');

const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function isValidAddress(address) {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function linkWallet(username, walletAddress) {
	try {
		if (!isValidAddress(walletAddress)) {
			log('Invalid wallet address format!', 'red');
			return false;
		}

		const user = await db.User.findOne({ where: { username } });
		if (!user) {
			log(`User "${username}" not found in database`, 'red');
			return false;
		}

		const existingWallet = await db.User.findOne({
			where: { walletAddress },
			attributes: ['username', 'walletAddress']
		});

		if (existingWallet && existingWallet.username !== username) {
			log(`Wallet is already linked to user "${existingWallet.username}"`, 'red');
			return false;
		}

		await user.update({ walletAddress });

		log('Successfully linked wallet', 'green');
		return true;
	} catch (error) {
		log(`Error linking wallet: ${error.message}`, 'red');
		return false;
	}
}

async function unlinkWallet(username) {
	try {
		const user = await db.User.findOne({ where: { username } });
		if (!user || !user.walletAddress) {
			log(`No linked wallet found for "${username}"`, 'yellow');
			return false;
		}

		await user.update({ walletAddress: null });
		log('Successfully unlinked wallet', 'green');
		return true;
	} catch (error) {
		log(`Error unlinking wallet: ${error.message}`, 'red');
		return false;
	}
}

async function listWallets() {
	const users = await db.User.findAll({
		where: {
			walletAddress: { [Sequelize.Op.ne]: null }
		},
		attributes: ['username', 'walletAddress'],
		order: [['username', 'ASC']]
	});

	if (users.length === 0) {
		log('No users have linked wallets', 'yellow');
		return;
	}

	for (const user of users) {
		console.log(`${user.username}: ${user.walletAddress}`);
	}
}

async function verifyWallet(username) {
	const user = await db.User.findOne({
		where: { username },
		attributes: ['username', 'walletAddress']
	});

	if (!user) {
		log(`User "${username}" not found`, 'red');
		return false;
	}

	if (!user.walletAddress) {
		log(`User "${username}" has no linked wallet`, 'yellow');
		return false;
	}

	log(`Wallet for ${username}: ${user.walletAddress}`, 'green');
	return true;
}

async function bulkLink(jsonFile) {
	const data = require(jsonFile);
	let success = 0;

	for (const item of data) {
		const { username, walletAddress } = item;
		if (username && walletAddress && await linkWallet(username, walletAddress)) {
			success++;
		}
	}

	log(`Bulk linked ${success}/${data.length} wallet records`, 'cyan');
}

async function main() {
	const args = process.argv.slice(2);
	const command = (args[0] || '').toLowerCase();

	switch (command) {
		case 'link':
			await linkWallet(args[1], args[2]);
			break;
		case 'unlink':
			await unlinkWallet(args[1]);
			break;
		case 'list':
			await listWallets();
			break;
		case 'verify':
			await verifyWallet(args[1]);
			break;
		case 'bulk':
			await bulkLink(args[1]);
			break;
		default:
			console.log('Usage: node services/wallet-service/manage-wallets.cjs <link|unlink|list|verify|bulk> ...');
			process.exit(1);
	}

	process.exit(0);
}

main();