(module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('market_listings', 'seller_signature', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Off-chain signature from seller approving the listing/trade payload'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('market_listings', 'seller_signature');
  }
});
