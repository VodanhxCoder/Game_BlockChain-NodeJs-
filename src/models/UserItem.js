// models/UserItem.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {

  class UserItem extends Model {}

  UserItem.init({
    // --- THUỘC TÍNH ---
    userItemId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false
      //trỏ đến user 
    },
    itemId: {
      type: DataTypes.BIGINT,
      allowNull: false
        //trỏ đến item
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: { msg: "Số lượng phải là số nguyên." },
        min: {
          args: [1],
          msg: "Số lượng tối thiểu phải là 1."
        }
      }
    },
    acquiredDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    // --- TÙY CHỌN ---
    sequelize,
    modelName: 'UserItem',
    tableName: 'User_Items', 
    timestamps: false 
  });

  return UserItem;
};