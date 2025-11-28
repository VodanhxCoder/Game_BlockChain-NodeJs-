import xss from 'xss';

/**
 * Middleware to sanitize request data (body, query, params) using xss library.
 * This replaces the deprecated xss-clean package which causes errors with modern Express.
 */
const xssSanitizer = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key]);
        } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
            // Simple recursive sanitization for nested objects could be added here if needed
            // For now, we just handle top-level strings to match basic xss-clean behavior
        }
      }
    }
  }

  // Sanitize query
  if (req.query) {
    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = xss(req.query[key]);
        }
      }
    }
  }

  // Sanitize params
  if (req.params) {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        if (typeof req.params[key] === 'string') {
          req.params[key] = xss(req.params[key]);
        }
      }
    }
  }

  next();
};

export default xssSanitizer;
