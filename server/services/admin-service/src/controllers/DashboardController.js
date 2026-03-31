import db from '../../../shared/models/index.js';
const { User, Item, DropPool } = db;

class DashboardController {
  async getStats(req, res) {
    try {
      // 1. Total Users
      const totalUsers = await User.count();

      // 2. Active Users
      const activeUsers = await User.count({
        where: { status: 'active' }
      });

      // 3. Total Items (Item definitions)
      const totalItems = await Item.count();

      // 4. Average Drop Rate
      const dropRates = await DropPool.findAll({
        attributes: ['dropRate'],
        where: { active: true }
      });
      
      let avgDropRate = 0;
      if (dropRates.length > 0) {
        const sum = dropRates.reduce((acc, curr) => acc + parseFloat(curr.dropRate), 0);
        avgDropRate = (sum / dropRates.length).toFixed(2);
      }

      // 5. Recent Users
      const recentUsers = await User.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['username', 'email', 'status', 'createdAt', 'playername']
      });

      // Format recent users for frontend
      const formattedRecentUsers = recentUsers.map(user => ({
        id: user.username, // Use username as ID
        name: user.playername || user.username,
        email: user.email,
        status: user.status,
        joinDate: user.createdAt
      }));

      return res.status(200).json({
        stats: [
            { 
              label: "Tổng người dùng", 
              value: totalUsers.toLocaleString(), 
              icon: "users", 
              color: "primary" 
            },
            { 
              label: "Người dùng hoạt động", 
              value: activeUsers.toLocaleString(), 
              icon: "active", 
              color: "success" 
            },
            { 
              label: "Tổng vật phẩm", 
              value: totalItems.toLocaleString(), 
              icon: "items", 
              color: "warning" 
            },
            { 
              label: "Drop rate trung bình", 
              value: `${avgDropRate}%`, 
              icon: "rate", 
              color: "primary" 
            },
        ],
        recentUsers: formattedRecentUsers
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default new DashboardController();
