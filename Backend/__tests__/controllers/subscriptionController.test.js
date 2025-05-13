const { createSubscription, getSubscriptions, cancelSubscription, updateSubscription } = require('../../controllers/subscriptionController');
const pool = require('../../config/database');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('Subscription Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { id: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const subscriptionData = {
        planId: 1,
        startDate: '2023-05-01',
        endDate: '2023-06-01',
        paymentMethod: 'khalti',
        paymentStatus: 'completed',
        transactionId: 'TXN123'
      };
      req.body = subscriptionData;

      pool.query
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert subscription
        .mockResolvedValueOnce([[{ id: 1, ...subscriptionData, userId: 1 }]]); // Get subscription

      await createSubscription(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, payment_method, payment_status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, subscriptionData.planId, subscriptionData.startDate, subscriptionData.endDate, subscriptionData.paymentMethod, subscriptionData.paymentStatus, subscriptionData.transactionId]
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription created successfully',
        data: expect.objectContaining({
          id: 1,
          userId: 1,
          ...subscriptionData
        })
      });
    });

    it('should handle database errors when creating subscription', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.body = {
        planId: 1,
        startDate: '2023-05-01',
        endDate: '2023-06-01'
      };

      await createSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getSubscriptions', () => {
    it('should retrieve user subscriptions', async () => {
      const mockSubscriptions = [
        { id: 1, userId: 1, planId: 1, startDate: '2023-05-01', endDate: '2023-06-01', status: 'active' },
        { id: 2, userId: 1, planId: 2, startDate: '2023-06-01', endDate: '2023-07-01', status: 'active' }
      ];

      pool.query.mockResolvedValueOnce([mockSubscriptions]);

      await getSubscriptions(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSubscriptions
      });
    });

    it('should handle database errors when retrieving subscriptions', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);

      await getSubscriptions(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription successfully', async () => {
      const subscriptionId = 1;
      req.params.id = subscriptionId;

      pool.query
        .mockResolvedValueOnce([[{ id: subscriptionId, userId: 1, status: 'active' }]]) // Check subscription
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update subscription

      await cancelSubscription(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
        [subscriptionId, req.user.id]
      );

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE subscriptions SET status = ?, cancelled_at = NOW() WHERE id = ?',
        ['cancelled', subscriptionId]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    });

    it('should handle non-existent subscription', async () => {
      const subscriptionId = 999;
      req.params.id = subscriptionId;

      pool.query.mockResolvedValueOnce([[]]); // No subscription found

      await cancelSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subscription not found'
      });
    });

    it('should handle database errors when cancelling subscription', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.params.id = 1;

      await cancelSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription successfully', async () => {
      const subscriptionId = 1;
      const updateData = {
        planId: 2,
        endDate: '2023-08-01'
      };
      req.params.id = subscriptionId;
      req.body = updateData;

      pool.query
        .mockResolvedValueOnce([[{ id: subscriptionId, userId: 1, status: 'active' }]]) // Check subscription
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update subscription
        .mockResolvedValueOnce([[{ id: subscriptionId, userId: 1, ...updateData }]]); // Get updated subscription

      await updateSubscription(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
        [subscriptionId, req.user.id]
      );

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE subscriptions SET plan_id = ?, end_date = ? WHERE id = ?',
        [updateData.planId, updateData.endDate, subscriptionId]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription updated successfully',
        data: expect.objectContaining({
          id: subscriptionId,
          userId: 1,
          ...updateData
        })
      });
    });

    it('should handle non-existent subscription for update', async () => {
      const subscriptionId = 999;
      req.params.id = subscriptionId;
      req.body = { planId: 2 };

      pool.query.mockResolvedValueOnce([[]]); // No subscription found

      await updateSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subscription not found'
      });
    });

    it('should handle database errors when updating subscription', async () => {
      const error = new Error('Database error');
      pool.query.mockRejectedValueOnce(error);
      req.params.id = 1;
      req.body = { planId: 2 };

      await updateSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
}); 