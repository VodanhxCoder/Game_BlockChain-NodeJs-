'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('market_listings', 'seller_signature_timestamp', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'Timestamp when seller signature was created (milliseconds)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('market_listings', 'seller_signature_timestamp');
  }
};
