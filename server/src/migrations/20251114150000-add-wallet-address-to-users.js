"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add walletAddress column to users table
    await queryInterface.addColumn('users', 'walletAddress', {
      type: Sequelize.STRING(66), // allow full private-style hex (0x + 64) though address is 42, keep room
      allowNull: true,
      unique: true,
      comment: 'User linked wallet address (hex)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'walletAddress');
  }
};
