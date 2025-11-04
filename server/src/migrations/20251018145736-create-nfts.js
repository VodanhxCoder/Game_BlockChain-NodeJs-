'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NFTs', {
      itemId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'Items', // Đây là mối quan hệ 1-1 với Bảng Items
          key: 'itemId'
        },
        onDelete: 'CASCADE' // Nếu Item bị xóa, record NFT này cũng bị xóa
      },
      contractAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tokenId: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      transactionHash: {
        type: Sequelize.STRING
      },
      mintTimestamp: {
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NFTs');
  }
};