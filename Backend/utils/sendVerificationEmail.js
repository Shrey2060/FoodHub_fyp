const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        // Create a test account if no credentials are provided
        const testAccount = await nodemailer.createTestAccount();
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER || testAccount.user,
                pass: process.env.EMAIL_PASS || testAccount.pass
            }
        });

        const info = await transporter.sendMail({
            from: '"FoodHUB" <noreply@foodhub.com>',
            to: email,
            subject: 'Verify your email address',
            text: `Please verify your email by clicking this link: ${process.env.FRONTEND_URL}/verify/${verificationToken}`,
            html: `<p>Please verify your email by clicking this link: <a href="${process.env.FRONTEND_URL}/verify/${verificationToken}">Verify Email</a></p>`
        });

        console.log('Verification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

module.exports = sendVerificationEmail; 