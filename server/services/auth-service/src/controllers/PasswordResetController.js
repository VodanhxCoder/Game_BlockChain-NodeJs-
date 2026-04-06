import passwordResetService from '../services/passwordResetService.js';

/**
 * Handle forgot password request
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const result = await passwordResetService.forgotPassword(req.body);
    return res.status(200).json(result);

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ error: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
  }
};
