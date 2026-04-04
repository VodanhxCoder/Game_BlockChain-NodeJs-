import db from '../../../shared/models/index.js';

const { User, Item, DropPool } = db;

const getDashboardStats = async () => {
  const totalUsers = await User.count();

  const activeUsers = await User.count({
    where: { status: 'active' },
  });

  const totalItems = await Item.count();

  const dropRates = await DropPool.findAll({
    attributes: ['dropRate'],
    where: { active: true },
  });

  let avgDropRate = 0;
  if (dropRates.length > 0) {
    const sum = dropRates.reduce((acc, curr) => acc + parseFloat(curr.dropRate), 0);
    avgDropRate = (sum / dropRates.length).toFixed(2);
  }

  const recentUsers = await User.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    attributes: ['username', 'email', 'status', 'createdAt', 'playername'],
  });

  const formattedRecentUsers = recentUsers.map((user) => ({
    id: user.username,
    name: user.playername || user.username,
    email: user.email,
    status: user.status,
    joinDate: user.createdAt,
  }));

  return {
    stats: [
      {
        label: 'Tổng người dùng',
        value: totalUsers.toLocaleString(),
        icon: 'users',
        color: 'primary',
      },
      {
        label: 'Người dùng hoạt động',
        value: activeUsers.toLocaleString(),
        icon: 'active',
        color: 'success',
      },
      {
        label: 'Tổng vật phẩm',
        value: totalItems.toLocaleString(),
        icon: 'items',
        color: 'warning',
      },
      {
        label: 'Drop rate trung bình',
        value: `${avgDropRate}%`,
        icon: 'rate',
        color: 'primary',
      },
    ],
    recentUsers: formattedRecentUsers,
  };
};

export default {
  getDashboardStats,
};
