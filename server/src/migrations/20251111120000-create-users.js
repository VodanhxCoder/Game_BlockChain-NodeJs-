"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      username: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(1024),
        allowNull: false,
      },
      playername: {
        type: Sequelize.STRING(100),
      },
      user_image: {
        type: Sequelize.STRING(255),
      },
      role: {
        type: Sequelize.ENUM("player", "admin"),
        defaultValue: "player",
      },
      status: {
        type: Sequelize.ENUM("active", "banned", "inactive"),
        defaultValue: "active",
      },
      high_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};