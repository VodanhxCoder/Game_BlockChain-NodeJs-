"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
  // (No need to index item_name when referencing by item_id)
    await queryInterface.createTable("market_listings", {
      listing_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      item_hash: {
        type: Sequelize.CHAR(64),
        allowNull: false,
        references: {
          model: "inventory_items",
          key: "item_hash",
        },
        onDelete: "CASCADE",
      },
      // the id of the item the seller wants in exchange (optional)
      wanted_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "items",
          key: "item_id",
        },
        onDelete: "SET NULL",
      },
      seller: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: "users",
          key: "username",
        },
        onDelete: "CASCADE",
      },
      tier: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add index on seller for faster queries
    await queryInterface.addIndex("market_listings", ["seller"]);
    
    // Add index on tier for filtering by rarity
    await queryInterface.addIndex("market_listings", ["tier"]);
    
    // Add index on created_at for sorting by listing time
    await queryInterface.addIndex("market_listings", ["created_at"]);
    
    // Add index on wanted_item_id to speed up lookup by desired item
    await queryInterface.addIndex("market_listings", ["wanted_item_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("market_listings");
  },
};
