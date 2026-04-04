import dashboardService from '../services/dashboardService.js';

class DashboardController {
  async getStats(req, res) {
    try {
      const result = await dashboardService.getDashboardStats();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new DashboardController();
