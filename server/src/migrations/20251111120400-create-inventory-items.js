"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_items", {
      inventory_item_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      inventory_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "inventories",
          key: "inventory_id",
        },
        onDelete: "CASCADE",
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "items",
          key: "item_id",
        },
        onDelete: "CASCADE",
      },
      owner: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: "users",
          key: "username",
        },
        onDelete: "CASCADE",
      },
      obtained_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      item_hash: {
        type: Sequelize.CHAR(64),
        unique: true,
      },
      in_market: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("inventory_items");
  },
};
