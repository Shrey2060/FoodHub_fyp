const sendPasswordResetEmail = require('../../utils/sendPasswordResetEmail');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';
  });

  it('should send a password reset email successfully', async () => {
    const email = 'user@example.com';
    const resetLink = 'http://example.com/reset';
    const result = await sendPasswordResetEmail(email, resetLink);
    expect(result).toEqual({ success: true, message: 'Password reset email sent.' });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: `"FoodHUB Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: expect.any(String)
    });
  });

  it('should throw an error if email credentials are missing', async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;
    const email = 'user@example.com';
    const resetLink = 'http://example.com/reset';
    await expect(sendPasswordResetEmail(email, resetLink)).rejects.toThrow('Failed to send password reset email.');
  });
}); 