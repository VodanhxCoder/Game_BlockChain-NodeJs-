import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const MediaPicker = ({ value, onSelect, placeholder, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(value); // Added state for preview URL

  // Sync preview when `value` prop changes (e.g., when editing an existing item)
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      if (res.data && res.data.url) {
        onSelect(res.data.url);
        setPreviewUrl(res.data.url); // Update preview URL
      } else {
        setError('Upload succeeded but no URL returned');
      }
    } catch (e) {
      console.error('Upload failed:', e);
      setError(e.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="media-picker">
      <input
        type="file"
        accept="image/*,.gif"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        style={{ marginBottom: '0.5rem' }}
      />
      {uploading && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Uploading...</div>}
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>}
      {previewUrl && (
        <div style={{ marginTop: '0.5rem' }}>
          {/* GIFs are supported by the browser in an <img> tag and will play automatically */}
          <img src={previewUrl} alt="selected" style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: 6 }} />
        </div>
      )}
    </div>
  );
};

MediaPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

MediaPicker.defaultProps = {
  placeholder: 'Select media',
  disabled: false,
};

export default MediaPicker;