const { completeOrder } = require('../../controllers/orderController');
const pool = require('../../config/database');
const rewardController = require('../../controllers/rewardController');

// Mock the pool module
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

// Mock the rewardController module
jest.mock('../../controllers/rewardController', () => ({
  addRewardPoints: jest.fn()
}));

describe('Order Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('completeOrder', () => {
    it('should complete an order and add reward points', async () => {
      const orderId = 100;
      const userId = 1;
      const mockOrder = [{ id: orderId, user_id: userId, total_amount: 100, order_type: 'RESTAURANT' }];
      pool.query.mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM orders')) {
          return Promise.resolve([[mockOrder[0]]]);
        } else if (query.includes('UPDATE orders')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        }
        return Promise.resolve([]);
      });
      rewardController.addRewardPoints.mockResolvedValue(110);

      const req = { params: { orderId }, user: { id: userId } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await completeOrder(req, res);

      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT * FROM orders WHERE id = ? AND user_id = ?',
        [orderId, userId]
      );
      expect(pool.query).toHaveBeenNthCalledWith(2,
        'UPDATE orders SET status = ? WHERE id = ?',
        ['COMPLETED', orderId]
      );
      expect(rewardController.addRewardPoints).toHaveBeenCalledWith(userId, orderId, 100, 'RESTAURANT');
      expect(res.json).toHaveBeenCalledWith({ message: 'Order completed successfully' });
    });

    it('should return 404 if order is not found', async () => {
      const orderId = 999;
      const userId = 1;
      pool.query.mockImplementation((query, params) => {
        if (query.includes('SELECT * FROM orders')) {
          return Promise.resolve([[]]);
        }
        return Promise.resolve([]);
      });

      const req = { params: { orderId }, user: { id: userId } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await completeOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Order not found' });
    });
  });
}); 