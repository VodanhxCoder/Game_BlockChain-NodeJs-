// models/User.js

// Import các thư viện cần thiết
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt'); 

module.exports = (sequelize) => {
  

  class User extends Model {
    /**
     * @param {string} password 
     * @returns {boolean}
     */
    validPassword(password) {
      return bcrypt.compareSync(password, this.passwordHash);
    }
  }


  User.init({
    // --- CÁC THUỘC TÍNH (Attributes) ---
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,    
      autoIncrement: true  
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false, 
      unique: { msg: "Tên đăng nhập này đã được sử dụng." },
      validate: {
        notEmpty: { msg: "Tên đăng nhập không được để trống." },
        len: {
          args: [3, 50],
          msg: "Tên đăng nhập phải từ 3 đến 50 ký tự."
        }
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Mật khẩu là bắt buộc." }
        // Logic validate mật khẩu gốc ở Controller
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: "Email này đã được sử dụng." },
      validate: {
        isEmail: { msg: "Email không đúng định dạng." }
      }
    },
    walletAddress: {
      type: DataTypes.STRING,
      unique: { msg: "Địa chỉ ví này đã được sử dụng." },
      allowNull: true, // Cho phép rỗng ban đầu
      validate: {
        is: {
          args: [/^0x[a-fA-F0-9]{40}$/],
          msg: "Địa chỉ ví không hợp lệ."
        }
      }
    },
    balance: {
      type: DataTypes.DECIMAL(19, 4), 
      defaultValue: 0.0,
      validate: {
        isDecimal: { msg: "Số dư phải là một con số." },
        min: {
          args: [0],
          msg: "Số dư không được là số âm."
        }
      }
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'USER',
      allowNull: false,
      validate: {
        isIn: {
          args: [['USER', 'ADMIN']],
          msg: "Quyền không hợp lệ (chỉ được là USER hoặc ADMIN)."
        }
      }
    }
  }, {
    // --- CÁC TÙY CHỌN (Options) ---
    sequelize,            
    modelName: 'User',
    timestamps: true,     
    
    // --- HOOKS (Tự động chạy khi có sự kiện) ---
    hooks: {
      // Tự động băm mật khẩu trước khi TẠO user
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      // Tự động băm mật khẩu trước khi CẬP NHẬT user
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      }
    }
  });

  return User;
};