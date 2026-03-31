import express from 'express';
import DashboardController from '../controllers/DashboardController.js';
import authJwt from '../../../shared/middleware/authJwt.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin only' });
  }
  next();
};

// GET /api/admin/dashboard/stats
router.get('/stats', [authJwt.verifyToken, requireAdmin], DashboardController.getStats);

export default router;
