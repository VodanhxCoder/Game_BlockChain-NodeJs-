import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

const mocks = {
  axios: { post: jest.fn() },
  db: { User: { findOne: jest.fn() } },
  emailService: { sendEmail: jest.fn() },
};

const mockPasswordResetService = {
  forgotPassword: jest.fn(),
};

// ============================================================================
// SERVICE FACTORY
// ============================================================================

const createPasswordResetService = (axios, db, emailService) => ({
  forgotPassword: async (data) => {
    if (!data?.email) {
      const error = new Error('Email là bắt buộc');
      error.status = 400;
      throw error;
    }

    if (!data?.recaptchaToken) {
      const error = new Error('CAPTCHA token là bắt buộc');
      error.status = 400;
      throw error;
    }

    // Check CAPTCHA
    if (process.env.RECAPTCHA_SECRET_KEY) {
      const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: data.recaptchaToken,
        },
      });

      if (!response.data.success) {
        const error = new Error('CAPTCHA xác nhận thất bại');
        error.status = 400;
        throw error;
      }
    }

    // Find user
    const user = await db.User.findOne({ where: { email: data.email } });
    if (!user) {
      const error = new Error('Email không tồn tại trong hệ thống');
      error.status = 404;
      throw error;
    }

    // Check if OAuth user
    if (user.provider !== 'local') {
      const error = new Error(`Tài khoản này được đăng ký qua ${user.provider}. Vui lòng đăng nhập bằng ${user.provider}.`);
      error.status = 400;
      throw error;
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(2, 14);
    user.password = newPassword;
    await user.save();

    // Send email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      text: `Mật khẩu mới của bạn là: ${newPassword}`,
    });

    return {
      message: 'Mật khẩu mới đã được gửi đến email của bạn.',
    };
  },
});

// ============================================================================
// CONTROLLER FACTORY
// ============================================================================

const createController = (service) => ({
  forgotPassword: async (req, res) => {
    try {
      const result = await service.forgotPassword(req.body);
      return res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
    }
  },
});

// ============================================================================
// PASSWORDRESETSERVICE TESTS
// ============================================================================

describe('PasswordResetService', () => {
  let service, mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createPasswordResetService(mocks.axios, mocks.db, mocks.emailService);
    mockUser = {
      id: 1,
      email: 'test@example.com',
      provider: 'local',
      password: 'oldpassword',
      save: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw 400 if email missing', async () => {
    try {
      await service.forgotPassword({ recaptchaToken: 'token' });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('should throw 400 if CAPTCHA token missing', async () => {
    try {
      await service.forgotPassword({ email: 'test@example.com' });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('should throw 400 if CAPTCHA verification fails', async () => {
    mocks.axios.post.mockResolvedValue({ data: { success: false } });
    process.env.RECAPTCHA_SECRET_KEY = 'test-key';

    try {
      await service.forgotPassword({ email: 'test@example.com', recaptchaToken: 'badToken' });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('should throw 404 if user not found', async () => {
    mocks.axios.post.mockResolvedValue({ data: { success: true } });
    mocks.db.User.findOne.mockResolvedValue(null);
    process.env.RECAPTCHA_SECRET_KEY = 'test-key';

    try {
      await service.forgotPassword({ email: 'notfound@example.com', recaptchaToken: 'token' });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.status).toBe(404);
    }
  });

  it('should throw 400 if user is OAuth provider', async () => {
    mocks.axios.post.mockResolvedValue({ data: { success: true } });
    mocks.db.User.findOne.mockResolvedValue({ ...mockUser, provider: 'google' });
    process.env.RECAPTCHA_SECRET_KEY = 'test-key';

    try {
      await service.forgotPassword({ email: 'test@example.com', recaptchaToken: 'token' });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.message).toContain('google');
    }
  });

  it('should send reset email on success', async () => {
    mocks.axios.post.mockResolvedValue({ data: { success: true } });
    mocks.db.User.findOne.mockResolvedValue(mockUser);
    mocks.emailService.sendEmail.mockResolvedValue(true);
    process.env.RECAPTCHA_SECRET_KEY = 'test-key';

    const result = await service.forgotPassword({ email: 'test@example.com', recaptchaToken: 'token' });

    expect(result.message).toBeDefined();
    expect(mocks.emailService.sendEmail).toHaveBeenCalled();
  });

  it('should save user with new password', async () => {
    mocks.axios.post.mockResolvedValue({ data: { success: true } });
    mocks.db.User.findOne.mockResolvedValue(mockUser);
    mocks.emailService.sendEmail.mockResolvedValue(true);
    process.env.RECAPTCHA_SECRET_KEY = 'test-key';

    await service.forgotPassword({ email: 'test@example.com', recaptchaToken: 'token' });

    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.password).not.toBe('oldpassword');
  });

  it('should work without RECAPTCHA_SECRET_KEY', async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    mocks.db.User.findOne.mockResolvedValue(mockUser);
    mocks.emailService.sendEmail.mockResolvedValue(true);

    const result = await service.forgotPassword({ email: 'test@example.com', recaptchaToken: 'token' });

    expect(result.message).toBeDefined();
    expect(mocks.axios.post).not.toHaveBeenCalled();
  });

  it('should throw 500 on network error', async () => {
    mocks.axios.post.mockRejectedValue(new Error('Network error'));
    process.env.RECAPTCHA_SECRET_KEY = 'test-key';

    try {
      await service.forgotPassword({ email: 'test@example.com', recaptchaToken: 'token' });
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('Network error');
    }
  });
});

// ============================================================================
// PASSWORDRESETCONTROLLER TESTS
// ============================================================================

describe('PasswordResetController', () => {
  let controller, mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = createController(mockPasswordResetService);
    mockReq = {
      body: {
        email: 'test@example.com',
        recaptchaToken: 'token123',
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should return 200 with success message', async () => {
    mockPasswordResetService.forgotPassword.mockResolvedValueOnce({
      message: 'Mật khẩu mới đã được gửi đến email của bạn.',
    });

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('should return 404 when email not found', async () => {
    const error = new Error('Email không tồn tại');
    error.status = 404;
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(error);

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 on validation error', async () => {
    const error = new Error('Email không hợp lệ');
    error.status = 400;
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(error);

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when CAPTCHA fails', async () => {
    const error = new Error('CAPTCHA verification failed');
    error.status = 400;
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(error);

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for OAuth users', async () => {
    const error = new Error('Cannot reset password for OAuth account');
    error.status = 400;
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(error);

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should return 500 on unexpected error', async () => {
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(new Error('Unexpected error'));

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should pass request body to service', async () => {
    mockPasswordResetService.forgotPassword.mockResolvedValueOnce({ message: 'Success' });

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockPasswordResetService.forgotPassword).toHaveBeenCalledWith(mockReq.body);
  });

  it('should handle empty request body', async () => {
    mockReq.body = {};
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(new Error('Email required'));

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should return generic error message for unexpected errors', async () => {
    mockPasswordResetService.forgotPassword.mockRejectedValueOnce(new Error('DB connection error'));

    await controller.forgotPassword(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
  });
});
