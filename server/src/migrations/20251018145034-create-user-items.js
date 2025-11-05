'use strict';

/** @type {import('sequelize-cli').Migration} */
// migrations/YYYYMMDDHHMMSS-create-user-items.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('User_Items', {
      userItemId: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Users', // Tên bảng mà nó tham chiếu đến
          key: 'userId'   // Tên cột khóa chính của bảng đó
        },
        onUpdate: 'CASCADE', // Nếu userId ở bảng Users thay đổi, cập nhật ở đây
        onDelete: 'CASCADE'  // Nếu User bị xóa, xóa các UserItem liên quan
      },
      itemId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'Items', // Tên bảng mà nó tham chiếu đến
          key: 'itemId'   // Tên cột khóa chính của bảng đó
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      acquiredDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('User_Items');
  }
};