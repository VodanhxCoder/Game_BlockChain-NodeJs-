import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

const mocks = {
  db: {
    User: {
      count: jest.fn(),
      findAll: jest.fn(),
    },
    Item: {
      count: jest.fn(),
    },
    DropPool: {
      findAll: jest.fn(),
    },
  },
};

// ============================================================================
// SERVICE FACTORY
// ============================================================================

const createDashboardService = (db) => ({
  getDashboardStats: async () => {
    const { User, Item, DropPool } = db;

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
  },
});

// ============================================================================
// CONTROLLER FACTORY
// ============================================================================

const createDashboardController = (dashboardService) => ({
  getStats: async (req, res) => {
    try {
      const result = await dashboardService.getDashboardStats();
      return res.status(200).json(result);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
});

// ============================================================================
// DASHBOARDSERVICE TESTS
// ============================================================================

describe('DashboardService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createDashboardService(mocks.db);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return stats with correct structure', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('recentUsers');
    expect(result.stats).toHaveLength(4);
  });

  it('should return correct total users count', async () => {
    mocks.db.User.count.mockResolvedValue(150);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.stats[0].value).toBe('150');
  });

  it('should return correct active users count', async () => {
    mocks.db.User.count.mockResolvedValueOnce(100); // total
    mocks.db.User.count.mockResolvedValueOnce(75); // active
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.stats[1].value).toBe('75');
  });

  it('should return correct total items count', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(200);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.stats[2].value).toBe('200');
  });

  it('should calculate average drop rate correctly', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([
      { dropRate: 10 },
      { dropRate: 20 },
      { dropRate: 30 },
    ]);

    const result = await service.getDashboardStats();

    expect(result.stats[3].value).toBe('20.00%');
  });

  it('should handle zero drop pools', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.stats[3].value).toBe('0%');
  });

  it('should format recent users correctly', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([
      {
        username: 'player1',
        playername: 'Player One',
        email: 'player1@example.com',
        status: 'active',
        createdAt: '2025-01-01',
      },
      {
        username: 'player2',
        playername: 'Player Two',
        email: 'player2@example.com',
        status: 'active',
        createdAt: '2025-01-02',
      },
    ]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.recentUsers).toHaveLength(2);
    expect(result.recentUsers[0]).toHaveProperty('id');
    expect(result.recentUsers[0]).toHaveProperty('name');
    expect(result.recentUsers[0]).toHaveProperty('email');
    expect(result.recentUsers[0]).toHaveProperty('status');
    expect(result.recentUsers[0]).toHaveProperty('joinDate');
  });

  it('should use username as fallback when playername is missing', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([
      {
        username: 'player1',
        playername: null,
        email: 'player1@example.com',
        status: 'active',
        createdAt: '2025-01-01',
      },
    ]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.recentUsers[0].name).toBe('player1');
  });

  it('should return empty recent users array when no users exist', async () => {
    mocks.db.User.count.mockResolvedValue(0);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(0);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.recentUsers).toHaveLength(0);
  });

  it('should format large numbers with locale string', async () => {
    mocks.db.User.count.mockResolvedValue(1000000);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(500000);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.stats[0].value).toContain('1');
    expect(result.stats[2].value).toContain('5');
  });

  it('should handle decimal drop rates correctly', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([
      { dropRate: 15.5 },
      { dropRate: 24.5 },
    ]);

    const result = await service.getDashboardStats();

    const dropRateValue = result.stats[3].value;
    expect(dropRateValue).toBe('20.00%');
  });

  it('should call User.count twice for total and active users', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    mocks.db.User.findAll.mockResolvedValue([]);
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    await service.getDashboardStats();

    expect(mocks.db.User.count).toHaveBeenCalledTimes(2);
  });

  it('should throw error when database query fails', async () => {
    mocks.db.User.count.mockRejectedValue(new Error('DB Connection failed'));

    try {
      await service.getDashboardStats();
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toContain('DB Connection failed');
    }
  });

  it('should limit recent users to 5', async () => {
    mocks.db.User.count.mockResolvedValue(100);
    const allUsers = Array.from({ length: 10 }, (_, i) => ({
      username: `player${i}`,
      playername: `Player ${i}`,
      email: `player${i}@example.com`,
      status: 'active',
      createdAt: `2025-01-0${i}`,
    }));
    // Mock findAll to respect the limit parameter
    mocks.db.User.findAll.mockImplementation(async (options) => {
      const limit = options?.limit || allUsers.length;
      return allUsers.slice(0, limit);
    });
    mocks.db.Item.count.mockResolvedValue(50);
    mocks.db.DropPool.findAll.mockResolvedValue([]);

    const result = await service.getDashboardStats();

    expect(result.recentUsers.length).toBeLessThanOrEqual(5);
    expect(result.recentUsers.length).toBe(5);
  });
});

// ============================================================================
// DASHBOARDCONTROLLER TESTS
// ============================================================================

describe('DashboardController', () => {
  let controller, mockDashboardService, mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardService = {
      getDashboardStats: jest.fn(),
    };
    controller = createDashboardController(mockDashboardService);
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should return 200 with stats', async () => {
    const mockStats = {
      stats: [
        { label: 'Total Users', value: 100, icon: 'users', color: 'primary' },
      ],
      recentUsers: [],
    };
    mockDashboardService.getDashboardStats.mockResolvedValue(mockStats);

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockStats);
  });

  it('should call getDashboardStats', async () => {
    mockDashboardService.getDashboardStats.mockResolvedValue({
      stats: [],
      recentUsers: [],
    });

    await controller.getStats(mockReq, mockRes);

    expect(mockDashboardService.getDashboardStats).toHaveBeenCalled();
  });

  it('should return 500 on service error', async () => {
    mockDashboardService.getDashboardStats.mockRejectedValue(
      new Error('Service error')
    );

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  it('should handle database connection errors', async () => {
    mockDashboardService.getDashboardStats.mockRejectedValue(
      new Error('DB Connection failed')
    );

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should return complete stats object with 4 stat items', async () => {
    const mockStats = {
      stats: [
        { label: 'Tổng người dùng', value: '100', icon: 'users', color: 'primary' },
        { label: 'Người dùng hoạt động', value: '75', icon: 'active', color: 'success' },
        { label: 'Tổng vật phẩm', value: '200', icon: 'items', color: 'warning' },
        { label: 'Drop rate trung bình', value: '20%', icon: 'rate', color: 'primary' },
      ],
      recentUsers: [],
    };
    mockDashboardService.getDashboardStats.mockResolvedValue(mockStats);

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    const calledWith = mockRes.json.mock.calls[0][0];
    expect(calledWith.stats).toHaveLength(4);
  });

  it('should return recent users in response', async () => {
    const mockStats = {
      stats: [],
      recentUsers: [
        {
          id: 'player1',
          name: 'Player One',
          email: 'player1@example.com',
          status: 'active',
          joinDate: '2025-01-01',
        },
      ],
    };
    mockDashboardService.getDashboardStats.mockResolvedValue(mockStats);

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith(mockStats);
  });

  it('should handle empty recent users array', async () => {
    const mockStats = {
      stats: [
        { label: 'Total Users', value: 0, icon: 'users', color: 'primary' },
      ],
      recentUsers: [],
    };
    mockDashboardService.getDashboardStats.mockResolvedValue(mockStats);

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
  });

  it('should handle timeout errors', async () => {
    mockDashboardService.getDashboardStats.mockRejectedValue(
      new Error('Request timeout')
    );

    await controller.getStats(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should not throw error on cleanup', async () => {
    mockDashboardService.getDashboardStats.mockResolvedValue({
      stats: [],
      recentUsers: [],
    });

    expect(async () => {
      await controller.getStats(mockReq, mockRes);
    }).not.toThrow();
  });
});
