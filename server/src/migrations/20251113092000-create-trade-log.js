"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("trade_log", {
      trade_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      // Item information
      item_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
        references: {
          model: "inventory_items",
          key: "item_hash",
        },
        onDelete: "CASCADE",
      },
      // User information
      from_user: {
        type: Sequelize.VARCHAR(50),
        allowNull: true,
        references: {
          model: "users",
          key: "username",
        },
        onDelete: "SET NULL",
      },
      to_user: {
        type: Sequelize.VARCHAR(50),
        allowNull: true,
        references: {
          model: "users",
          key: "username",
        },
        onDelete: "SET NULL",
      },
      // Blockchain transaction information
      transaction_hash: {
        type: Sequelize.STRING(66), // 0x + 64 hex chars
        allowNull: true, // Nullable since not all trades may use blockchain
        unique: true,
      },
      transaction_type: {
        type: Sequelize.ENUM('MINT', 'TRADE', 'LIST', 'UNLIST', 'TRANSFER'),
        allowNull: false,
        defaultValue: 'TRADE',
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'FAILED'),
        allowNull: false,
        defaultValue: 'CONFIRMED',
      },
      block_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      gas_used: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      // Wallet addresses (from MetaMask)
      from_wallet: {
        type: Sequelize.STRING(42), // Ethereum address: 0x + 40 hex chars
        allowNull: true,
      },
      to_wallet: {
        type: Sequelize.STRING(42),
        allowNull: true,
      },
      // References to related entities
      listing_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "market_listings",
          key: "listing_id",
        },
        onDelete: "SET NULL",
      },
      // Additional context (stored as JSON)
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional trade details: item names, rarities, trade conditions, etc.'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Timestamps
      traded_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes for common queries
    await queryInterface.addIndex("trade_log", ["item_hash"]);
    await queryInterface.addIndex("trade_log", ["from_user"]);
    await queryInterface.addIndex("trade_log", ["to_user"]);
    await queryInterface.addIndex("trade_log", ["transaction_hash"]);
    await queryInterface.addIndex("trade_log", ["transaction_type"]);
    await queryInterface.addIndex("trade_log", ["status"]);
    await queryInterface.addIndex("trade_log", ["listing_id"]);
    await queryInterface.addIndex("trade_log", ["traded_at"]);
    await queryInterface.addIndex("trade_log", ["from_wallet"]);
    await queryInterface.addIndex("trade_log", ["to_wallet"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("trade_log");
  },
};
