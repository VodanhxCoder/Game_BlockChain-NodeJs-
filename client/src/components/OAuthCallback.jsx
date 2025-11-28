
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      console.log('OAuth Callback: Token found, logging in...');
      setToken(token);
      navigate('/H', { replace: true });
    } else {
      console.error('OAuth Callback: No token found in URL');
      navigate('/signin', { replace: true });
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#1a1a1a',
      color: '#fff'
    }}>
      Processing login...
    </div>
  );
};

export default OAuthCallback;
