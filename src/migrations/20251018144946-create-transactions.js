'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transactions', {
      transactionId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      buyerId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'userId'
        },
        onDelete: 'SET NULL'
      },
      sellerId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'userId'
        },
        onDelete: 'SET NULL'
      },
      itemId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Items',
          key: 'itemId'
        },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Transactions');
  }
};
