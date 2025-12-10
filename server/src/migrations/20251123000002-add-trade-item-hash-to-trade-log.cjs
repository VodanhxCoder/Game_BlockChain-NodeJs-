'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('trade_log');
    if (!tableInfo.trade_item_hash) {
      await queryInterface.addColumn('trade_log', 'trade_item_hash', {
        type: Sequelize.CHAR(64),
        allowNull: true,
        comment: "Secondary item hash (buyer's item in a trade)"
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('trade_log');
    if (tableInfo.trade_item_hash) {
      await queryInterface.removeColumn('trade_log', 'trade_item_hash');
    }
  }
};
