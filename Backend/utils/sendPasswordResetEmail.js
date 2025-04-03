const nodemailer = require("nodemailer");
require("dotenv").config(); // Ensure environment variables are loaded

const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    // Debugging: Ensure environment variables are loaded correctly
    console.log("Using EMAIL_USER:", process.env.EMAIL_USER);
    console.log("Using EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing email credentials in environment variables.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Prevents SSL/TLS errors
      },
    });

    const mailOptions = {
      from: `"FoodHUB Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; background: #f4f4f4; border-radius: 8px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Reset Password
            </a>
          </p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Regards,<br/>FoodHUB Support Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!", info.messageId);
    return { success: true, message: "Password reset email sent." };
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send password reset email.");
  }
};

module.exports = sendPasswordResetEmail;
