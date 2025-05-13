const { validateRegistration, validateLogin } = require('../../middleware/validationMiddleware');

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateRegistration', () => {
    it('should pass validation for valid registration data', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateRegistration) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          return;
        }
      }
      expect(next).toHaveBeenCalledTimes(validateRegistration.length);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateRegistration) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          break;
        }
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email format'
      });
      expect(next.mock.calls.length).toBeLessThan(validateRegistration.length);
    });

    it('should return 400 for weak password', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateRegistration) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          break;
        }
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
      expect(next.mock.calls.length).toBeLessThan(validateRegistration.length);
    });

    it('should return 400 for missing required fields', async () => {
      req.body = {
        email: 'test@example.com'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateRegistration) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          break;
        }
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password is required'
      });
      expect(next.mock.calls.length).toBeLessThan(validateRegistration.length);
    });
  });

  describe('validateLogin', () => {
    it('should pass validation for valid login data', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateLogin) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          return;
        }
      }
      expect(next).toHaveBeenCalledTimes(validateLogin.length);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing email', async () => {
      req.body = {
        password: 'Password123!'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateLogin) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          break;
        }
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email is required'
      });
      expect(next.mock.calls.length).toBeLessThan(validateLogin.length);
    });

    it('should return 400 for missing password', async () => {
      req.body = {
        email: 'test@example.com'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateLogin) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          break;
        }
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password is required'
      });
      expect(next.mock.calls.length).toBeLessThan(validateLogin.length);
    });

    it('should return 400 for invalid email format', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'Password123!'
      };

      // Run all middleware functions in sequence
      for (const middleware of validateLogin) {
        await middleware(req, res, next);
        // Stop if response has been sent
        if (res.status.mock.calls.length > 0) {
          break;
        }
      }
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email format'
      });
      expect(next.mock.calls.length).toBeLessThan(validateLogin.length);
    });
  });
});