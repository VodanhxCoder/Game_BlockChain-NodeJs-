
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OAuthLoading from './OAuthLoading';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const runOAuthCallback = async () => {
      const token = searchParams.get('token');
      const providerError = searchParams.get('error');

      if (providerError) {
        navigate('/signin', {
          replace: true,
          state: { oauthError: decodeURIComponent(providerError) }
        });
        return;
      }

      if (!token) {
        navigate('/signin', {
          replace: true,
          state: { oauthError: 'OAuth login failed. No token returned.' }
        });
        return;
      }

      // Persist token and attempt hydration, but do not block home navigation on /me timing issues.
      await setToken(token);

      navigate('/H', { replace: true });
    };

    runOAuthCallback();
  }, [searchParams, navigate, setToken]);

  return <OAuthLoading />;
};

export default OAuthCallback;
