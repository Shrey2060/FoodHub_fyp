const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/database');

describe('Complete Order Flow System Test', () => {
  let authToken;
  let userId;
  let cartItemId;
  let orderId;
  let paymentId;

  beforeAll(async () => {
    // Create a test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!@#',
        phone: '1234567890'
      });

    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM payments WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM orders WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  });

  describe('Cart to Order Flow', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 1,
          quantity: 2,
          price: 10.99
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      cartItemId = response.body.data.id;
    });

    it('should retrieve cart items', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should create order from cart', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deliveryAddress: '123 Test St',
          paymentMethod: 'khalti'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      orderId = response.body.data.id;
    });
  });

  describe('Payment Flow', () => {
    it('should initiate Khalti payment', async () => {
      const response = await request(app)
        .post('/api/payment/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: orderId,
          amount: 21.98,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '1234567890'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payment_url');
      expect(response.body.data).toHaveProperty('pidx');
    });

    it('should verify payment', async () => {
      const response = await request(app)
        .post('/api/payment/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pidx: 'test_pidx_123',
          orderId: orderId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      paymentId = response.body.data.transaction_id;
    });
  });

  describe('Order Status Flow', () => {
    it('should update order status after payment', async () => {
      const response = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paid');
    });

    it('should allow order cancellation if not delivered', async () => {
      const response = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('Reward Points Flow', () => {
    it('should award points for completed order', async () => {
      const response = await request(app)
        .get('/api/rewards/points')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.points).toBeGreaterThan(0);
    });

    it('should allow point redemption', async () => {
      const response = await request(app)
        .post('/api/rewards/redeem')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          points: 100
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.discount).toBeGreaterThan(0);
    });
  });
}); 