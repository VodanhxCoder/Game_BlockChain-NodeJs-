// utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Tạo transporter cho email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Gửi email xác nhận với mã 6 số
 * @param {string} to - Email người nhận
 * @param {string} verificationCode - Mã xác nhận 6 số
 * @param {string} username - Tên người dùng
 */
const sendVerificationEmail = async (to, verificationCode, username) => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận email</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(45deg, #1a1a2e, #16213e);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .greeting {
          font-size: 24px;
          color: #333;
          margin-bottom: 20px;
        }
        .verification-code {
          background: #f8f9fa;
          border: 2px dashed #6c757d;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #495057;
          font-family: 'Courier New', monospace;
        }
        .instructions {
          color: #666;
          line-height: 1.6;
          margin: 20px 0;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 Game BlockChain</div>
          <div>Xác nhận tài khoản của bạn</div>
        </div>
        <div class="content">
          <div class="greeting">Xin chào, ${username}!</div>
          <p class="instructions">
            Cảm ơn bạn đã đăng ký tài khoản Game BlockChain. Để hoàn tất quá trình đăng ký, 
            vui lòng nhập mã xác nhận sau vào trang web:
          </p>
          <div class="verification-code">${verificationCode}</div>
          <p class="instructions">
            Mã này sẽ hết hạn sau <strong>10 phút</strong>. 
            Nếu bạn không yêu cầu tạo tài khoản, hãy bỏ qua email này.
          </p>
          <div class="warning">
            ⚠️ Không chia sẻ mã này với bất kỳ ai khác để bảo mật tài khoản.
          </div>
        </div>
        <div class="footer">
          <p>© 2025 Game BlockChain. Mọi quyền được bảo lưu.</p>
          <p>Nếu bạn cần hỗ trợ, liên hệ: support@gameblockchain.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: '🎮 Mã xác nhận tài khoản Game BlockChain',
    html: htmlTemplate,
    text: `Xin chào ${username}!\n\nMã xác nhận của bạn là: ${verificationCode}\n\nMã này sẽ hết hạn sau 10 phút.\n\nGame BlockChain Team`
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email verification sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
  }
};

/**
 * Tạo mã xác nhận 6 số ngẫu nhiên
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generic function to send email with custom content
 * @param {string} to - Email recipient
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};

module.exports = {
  sendVerificationEmail,
  generateVerificationCode,
  sendEmail
};