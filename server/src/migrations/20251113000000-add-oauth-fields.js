'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'google_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('users', 'github_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('users', 'provider', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'local',
    });

    // Make password_hash nullable for OAuth users
    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(1024),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'google_id');
    await queryInterface.removeColumn('users', 'github_id');
    await queryInterface.removeColumn('users', 'provider');
    
    // Revert password_hash to not null
    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(1024),
      allowNull: false,
    });
  }
};
