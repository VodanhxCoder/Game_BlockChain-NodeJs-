// utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Tạo transporter cho email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
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
    console.log(`Email sent successfully to ${to}. Message ID: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};

/**
 * Gửi email chứa mật khẩu mới
 * @param {string} to - Email người nhận
 * @param {string} newPassword - Mật khẩu mới
 * @param {string} username - Tên người dùng
 */
const sendNewPasswordEmail = async (to, newPassword, username) => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cấp lại mật khẩu</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: #2d3748; color: #ffffff; padding: 20px; text-align: center; }
        .content { padding: 30px; color: #4a5568; line-height: 1.6; }
        .password-box { background: #edf2f7; padding: 15px; border-radius: 6px; text-align: center; font-family: monospace; font-size: 24px; letter-spacing: 2px; color: #2d3748; margin: 20px 0; border: 2px dashed #cbd5e0; }
        .footer { background: #f7fafc; padding: 15px; text-align: center; font-size: 12px; color: #718096; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 24px;">Cấp Lại Mật Khẩu</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${username}</strong>,</p>
          <p>Chúng tôi đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn.</p>
          <p>Đây là mật khẩu mới của bạn:</p>
          <div class="password-box">${newPassword}</div>
          <p>Vui lòng đăng nhập và đổi mật khẩu ngay lập tức để đảm bảo an toàn.</p>
          <p>Nếu bạn không yêu cầu thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Game BlockChain. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(to, 'Cấp lại mật khẩu - Game BlockChain', htmlTemplate);
};

export {
  sendVerificationEmail,
  generateVerificationCode,
  sendEmail,
  sendNewPasswordEmail
};

export default {
  sendVerificationEmail,
  generateVerificationCode,
  sendEmail,
  sendNewPasswordEmail
};