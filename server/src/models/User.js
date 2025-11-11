// models/User.js

const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  /**
   * User model aligned with the provided SQL dump `users` table.
   * - `username` is the PK (varchar(50))
   * - password stored in `password_hash` (mapped to passwordHash attr)
   * - created_at timestamp is mapped to createdAt; updatedAt disabled
   */
  class User extends Model {
    /**
     * Compare an incoming (already client-hashed) password against stored hash.
     * For this project the frontend sends a SHA-256 hex digest and we store it
     * directly in the DB (no additional bcrypt round). So compare by equality.
     * @param {string} candidatePassword - value sent from client (e.g. SHA-256 hex)
     * @returns {boolean}
     */
    validPassword(candidatePassword) {
      return candidatePassword === this.passwordHash;
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        primaryKey: true,
        validate: {
          notEmpty: { msg: 'Tên đăng nhập không được để trống.' },
          len: { args: [1, 50], msg: 'Tên đăng nhập tối đa 50 ký tự.' },
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: 'Email này đã được sử dụng.' },
        validate: { isEmail: { msg: 'Email không đúng định dạng.' } },
      },
      passwordHash: {
        // map JS attr passwordHash to DB column `password_hash`
        type: DataTypes.STRING(1024),
        allowNull: false,
        field: 'password_hash',
        validate: {
          notEmpty: { msg: 'Mật khẩu là bắt buộc.' },
        },
      },
      playername: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      userImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'user_image',
      },
      role: {
        type: DataTypes.ENUM('player', 'admin'),
        allowNull: false,
        defaultValue: 'player',
      },
      status: {
        type: DataTypes.ENUM('active', 'banned', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      highScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'high_score',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      // No hooks: the frontend sends a SHA-256 password and we store/compare it directly.
    }
  );

  return User;
};