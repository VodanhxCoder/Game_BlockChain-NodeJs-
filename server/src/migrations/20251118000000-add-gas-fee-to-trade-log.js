(module.exports = {
	up: async (queryInterface, Sequelize) => {
		// Add gas fee columns to trade_log
		await queryInterface.addColumn('trade_log', 'gas_fee', {
			type: Sequelize.STRING(78),
			allowNull: true,
			comment: 'Total gas fee paid (in wei)'
		});

		await queryInterface.addColumn('trade_log', 'gas_fee_eth', {
			type: Sequelize.DECIMAL(30, 18),
			allowNull: true,
			comment: 'Total gas fee paid (in ETH)'
		});
	},

	down: async (queryInterface, Sequelize) => {
		await queryInterface.removeColumn('trade_log', 'gas_fee_eth');
		await queryInterface.removeColumn('trade_log', 'gas_fee');
	}
});

