const pool = require('../config/database');

const createSubscription = async (req, res, next) => {
  try {
    const { planId, startDate, endDate, paymentMethod, paymentStatus, transactionId } = req.body;
    const userId = req.user.id;

    const [result] = await pool.query(
      'INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, payment_method, payment_status, transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, planId, startDate, endDate, paymentMethod, paymentStatus, transactionId]
    );

    const [subscription] = await pool.query(
      'SELECT * FROM subscriptions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription[0]
    });
  } catch (error) {
    next(error);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [subscriptions] = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [subscription] = await pool.query(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!subscription.length) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await pool.query(
      'UPDATE subscriptions SET status = ?, cancelled_at = NOW() WHERE id = ?',
      ['cancelled', id]
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { planId, endDate } = req.body;

    const [subscription] = await pool.query(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!subscription.length) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await pool.query(
      'UPDATE subscriptions SET plan_id = ?, end_date = ? WHERE id = ?',
      [planId, endDate, id]
    );

    const [updatedSubscription] = await pool.query(
      'SELECT * FROM subscriptions WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: updatedSubscription[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  getSubscriptions,
  cancelSubscription,
  updateSubscription
}; 