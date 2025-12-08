import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProtectedImage = ({ src, alt, className, style, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const fetchImage = async () => {
      if (!src) {
        setLoading(false);
        return;
      }

      // Check if the URL is likely to be hosted on our backend (ngrok/localhost)
      // If it's a data URL or clearly external (e.g. googleusercontent), skip the fetch-blob dance
      const isBackendImage = src.includes('ngrok') || src.includes('localhost') || src.startsWith('/');
      
      if (!isBackendImage) {
        setImageSrc(src);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch the image as a blob, attaching the ngrok-skip header
        const response = await axios.get(src, {
          responseType: 'blob',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (isMounted) {
          objectUrl = URL.createObjectURL(response.data);
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        // console.error('Failed to load protected image via blob:', src);
        if (isMounted) {
          setError(true);
          setLoading(false);
          // Fallback to original src (maybe it works without header, or let browser handle 404)
          setImageSrc(src); 
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    // Render a placeholder or skeleton
    return (
      <div 
        className={`protected-image-loading ${className || ''}`} 
        style={{ 
          ...style, 
          backgroundColor: 'rgba(255,255,255,0.1)', 
          display: 'inline-block',
          minWidth: '20px',
          minHeight: '20px'
        }} 
      />
    );
  }

  return (
    <img 
      src={imageSrc || src} 
      alt={alt} 
      className={className} 
      style={style}
      onError={(e) => {
        // If blob failed or wasn't used, and direct load fails, we can't do much.
        // Just ensure we don't loop.
        if (e.target.src !== src) {
            e.target.src = src;
        }
      }}
      {...props} 
    />
  );
};

export default ProtectedImage;
