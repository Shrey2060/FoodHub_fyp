const request = require('supertest');
const app = require('../../app');
const pool = require('../../config/database');

describe('Subscription and Chat System Test', () => {
  let authToken;
  let userId;
  let subscriptionId;
  let chatRoomId;

  beforeAll(async () => {
    // Create a test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'Test123!@#',
        phone: '1234567891'
      });

    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE user_id = ?)', [userId]);
    await pool.query('DELETE FROM chat_rooms WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  });

  describe('Subscription Flow', () => {
    it('should create a new subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'khalti',
          paymentStatus: 'completed',
          transactionId: 'test_transaction_123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      subscriptionId = response.body.data.id;
    });

    it('should retrieve user subscriptions', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should update subscription', async () => {
      const response = await request(app)
        .put(`/api/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 2,
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan_id).toBe(2);
    });

    it('should cancel subscription', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscriptionId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('Chat Flow', () => {
    it('should create a new chat room', async () => {
      const response = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Chat Room',
          type: 'support'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      chatRoomId = response.body.data.id;
    });

    it('should send a message in the chat room', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${chatRoomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Hello, this is a test message',
          type: 'text'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Hello, this is a test message');
    });

    it('should retrieve chat messages', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${chatRoomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should retrieve user chat rooms', async () => {
      const response = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });
}); 