/**
 * Run migration to add walletAddress column to users table
 * This script runs the Sequelize migration programmatically
 */

const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
	try {
		console.log('Running migration: add-wallet-address-to-users...\n');

		const db = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE;
		const user = process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER;
		const pass = process.env.DB_PASS || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
		const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
		const port = process.env.DB_PORT || process.env.MYSQL_PORT || 3306;
		const dialect = process.env.DB_DIALECT || 'mysql';

		if (!db || !user) {
			throw new Error('Database credentials not found. Check your .env file');
		}

		const sequelize = new Sequelize(db, user, pass, {
			host,
			port,
			dialect,
			logging: false
		});

		await sequelize.authenticate();

		const queryInterface = sequelize.getQueryInterface();
		const tableDesc = await queryInterface.describeTable('users');

		if (!tableDesc.walletAddress) {
			await queryInterface.addColumn('users', 'walletAddress', {
				type: Sequelize.STRING(66),
				allowNull: true,
				unique: true,
				comment: 'User linked wallet address (hex)'
			});
			console.log('walletAddress column added successfully');
		} else {
			console.log('walletAddress column already exists');
		}

		await sequelize.close();
		process.exit(0);
	} catch (error) {
		console.error('Migration failed:', error.message);
		process.exit(1);
	}
}

runMigration();