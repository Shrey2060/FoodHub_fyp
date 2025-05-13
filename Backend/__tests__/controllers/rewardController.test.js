const { addRewardPoints, redeemRewardPoints } = require('../../controllers/rewardController');
const pool = require('../../config/database');

// Mock the pool module
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('Reward Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addRewardPoints', () => {
    it('should add reward points correctly for RESTAURANT order type', async () => {
      const userId = 1;
      const orderId = 100;
      const orderAmount = 100;
      const orderType = 'RESTAURANT';
      const mockSettings = [{ points_per_rupee: 1, restaurant_bonus_percentage: 10 }];
      pool.query.mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM reward_settings')) {
          return Promise.resolve([mockSettings]);
        } else if (query.includes('INSERT INTO reward_points')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        } else if (query.includes('INSERT INTO reward_transactions')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        }
        return Promise.resolve([]);
      });
      const result = await addRewardPoints(userId, orderId, orderAmount, orderType);
      expect(result).toBe(110); // basePoints (100) + bonusPoints (10)
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('redeemRewardPoints', () => {
    it('should redeem reward points correctly', async () => {
      const userId = 1;
      const pointsToRedeem = 100;
      const orderId = 200;
      const mockSettings = [{ points_to_rupee_ratio: 100 }];
      const mockRewardPoints = [{ current_points: 200 }];
      pool.query.mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM reward_settings')) {
          return Promise.resolve([mockSettings]);
        } else if (query.includes('SELECT current_points FROM reward_points')) {
          return Promise.resolve([mockRewardPoints]);
        } else if (query.includes('UPDATE reward_points')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        } else if (query.includes('INSERT INTO reward_transactions')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        }
        return Promise.resolve([]);
      });
      const result = await redeemRewardPoints(userId, pointsToRedeem, orderId);
      expect(result).toBe(1); // 100 points / 100 ratio = 1 rupee
      expect(pool.query).toHaveBeenCalled();
    });
  });
}); 