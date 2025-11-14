import axios from 'axios';

/**
 * Verify reCAPTCHA token with Google API
 * @route POST /api/recaptcha/verify
 * @body { token: string }
 */
const verifyRecaptcha = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'reCAPTCHA token is required' 
      });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error(' RECAPTCHA_SECRET_KEY not found in environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    // Verify token with Google reCAPTCHA API
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );

    const { success, score, action, challenge_ts, hostname } = response.data;

    if (success) {
      console.log(`reCAPTCHA verified - Score: ${score || 'N/A'}, Action: ${action || 'N/A'}`);
      return res.status(200).json({
        success: true,
        score: score || null,
        action: action || null,
        timestamp: challenge_ts,
        hostname: hostname
      });
    } else {
      console.log(' reCAPTCHA verification failed:', response.data);
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA verification failed',
        'error-codes': response.data['error-codes']
      });
    }

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to verify reCAPTCHA' 
    });
  }
};

export default {
  verifyRecaptcha
};
