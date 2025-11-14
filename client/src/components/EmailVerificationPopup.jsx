// EmailVerificationPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const EmailVerificationPopup = ({ 
  isOpen, 
  onClose, 
  onVerifySuccess, 
  email, 
  username,
  onResendCode 
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const { isDark } = useTheme();
  const inputRefs = useRef([]);

  // console.log("EmailVerificationPopup render - isOpen:", isOpen, "email:", email, "username:", username);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setError('Verification code has expired. Please request a new code.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen && email && username) {
      setCode(['', '', '', '', '', '']);
      setError('');
      setSuccess('Verification code sent to your email!');
      setTimeLeft(600);
      setResendCooldown(0);

      const successTimer = setTimeout(() => setSuccess(''), 3000);
      
      // Focus first input
      const focusTimer = setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);

      return () => {
        clearTimeout(successTimer);
        clearTimeout(focusTimer);
      };
    }
  }, [isOpen, email, username]);

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle Enter to submit
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      setCode(pasteData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Email verified successfully!');
      setTimeout(() => {
        onVerifySuccess();
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');

    try {
      await onResendCode();
      setSuccess('New verification code sent!');
      setTimeLeft(600);
      setResendCooldown(60); // 1 minute cooldown
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999
      }}
    >
      <div 
        className={`modal-content email-verification-modal ${isDark ? 'dark' : 'light'}`} 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: isDark ? '#1a1a2e' : 'white',
          borderRadius: '16px',
          maxWidth: '480px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: isDark ? '1px solid #2a2a3e' : 'none',
          color: isDark ? '#e0e1e6' : '#333'
        }}
      >
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Xác nhận Email</h3>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <p style={{ margin: '8px 0', color: '#6b7280', fontSize: '14px' }}>
              Chúng tôi đã gửi mã xác nhận 6 số đến
            </p>
            <strong style={{
              display: 'block',
              margin: '12px 0 16px',
              padding: '12px 16px',
              background: isDark ? '#2a2a3e' : '#f8fafc',
              border: `1px solid ${isDark ? '#3a3a4e' : '#e2e8f0'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {email}
            </strong>
            <p style={{ margin: '8px 0', color: '#6b7280', fontSize: '14px' }}>
              Nhập mã xác nhận để hoàn tất đăng ký:
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#059669',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              ✅ {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '24px 0 32px' }}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength="1"
                style={{
                  width: '48px',
                  height: '56px',
                  border: `2px solid ${digit ? '#10b981' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 600,
                  background: digit ? (isDark ? '#064e3b' : '#f0fdf4') : (isDark ? '#2a2a3e' : '#ffffff'),
                  color: digit ? (isDark ? '#34d399' : '#065f46') : (isDark ? '#e0e1e6' : '#1a1a2e'),
                  outline: 'none'
                }}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={loading}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              onClick={handleVerify}
              disabled={loading || code.join('').length !== 6}
              style={{
                padding: '12px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading || code.join('').length !== 6 ? 'not-allowed' : 'pointer',
                background: loading || code.join('').length !== 6 ? '#9ca3af' : '#6366f1',
                color: 'white',
                minHeight: '44px'
              }}
            >
              {loading ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
              {timeLeft > 0 ? (
                <span>Mã hết hạn sau: {formatTime(timeLeft)}</span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Mã đã hết hạn</span>
              )}
            </div>

            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              <span>Chưa nhận được mã? </span>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 || loading ? '#9ca3af' : '#6366f1',
                  cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  textDecoration: resendCooldown > 0 || loading ? 'none' : 'underline',
                  padding: 0,
                  fontSize: 'inherit'
                }}
              >
                {resendCooldown > 0 
                  ? `Gửi lại sau ${resendCooldown}s` 
                  : 'Gửi lại mã'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPopup;