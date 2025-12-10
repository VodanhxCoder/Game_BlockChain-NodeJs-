import { useEffect } from 'react';

/**
 * Custom hook to set page title
 * @param {string} title - The page title
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - Space Wars` : 'Space Wars - Blockchain Game';
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
