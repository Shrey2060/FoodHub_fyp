const { initiatePayment, verifyPayment } = require('../../controllers/khaltiController');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Khalti Payment Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should initiate payment successfully', async () => {
      const paymentData = {
        amount: 1000,
        orderId: 'ORDER123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '9801234567'
      };
      req.body = paymentData;

      const mockResponse = {
        data: {
          pidx: 'PIDX123',
          payment_url: 'https://khalti.com/pay/PIDX123'
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      await initiatePayment(req, res, next);

      expect(axios.post.mock.calls[0][0]).toBe('https://a.khalti.com/api/v2/epayment/initiate/');
      expect(axios.post.mock.calls[0][1]).toEqual(expect.objectContaining({
        amount: paymentData.amount * 100,
        purchase_order_id: paymentData.orderId,
        customer_info: expect.objectContaining({
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone
        })
      }));
      expect(axios.post.mock.calls[0][2]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }));

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          pidx: mockResponse.data.pidx,
          payment_url: mockResponse.data.payment_url
        }
      });
    });

    it('should handle payment initiation errors', async () => {
      const error = new Error('Payment initiation failed');
      axios.post.mockRejectedValueOnce(error);
      req.body = {
        amount: 1000,
        orderId: 'ORDER123'
      };

      await initiatePayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const pidx = 'PIDX123';
      req.params.pidx = pidx;

      const mockResponse = {
        data: {
          status: 'Completed',
          amount: 100000,
          transaction_id: 'TXN123',
          purchase_order_id: 'ORDER123'
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      await verifyPayment(req, res, next);

      expect(axios.post.mock.calls[0][0]).toBe('https://a.khalti.com/api/v2/epayment/lookup/');
      expect(axios.post.mock.calls[0][1]).toEqual({ pidx });
      expect(axios.post.mock.calls[0][2]).toEqual(expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }));

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: mockResponse.data.status,
          amount: mockResponse.data.amount / 100,
          transaction_id: mockResponse.data.transaction_id,
          order_id: mockResponse.data.purchase_order_id
        }
      });
    });

    it('should handle payment verification errors', async () => {
      const error = new Error('Payment verification failed');
      axios.post.mockRejectedValueOnce(error);
      req.params.pidx = 'PIDX123';

      await verifyPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle incomplete payments', async () => {
      const pidx = 'PIDX123';
      req.params.pidx = pidx;

      const mockResponse = {
        data: {
          status: 'Pending',
          amount: 100000,
          transaction_id: 'TXN123',
          purchase_order_id: 'ORDER123'
        }
      };
      axios.post.mockResolvedValueOnce(mockResponse);

      await verifyPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Payment is not completed'
      });
    });
  });
}); 