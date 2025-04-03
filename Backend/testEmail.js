const sendPasswordResetEmail = require("./utils/sendPasswordResetEmail");

(async () => {
  try {
    await sendPasswordResetEmail("recipient_email@gmail.com", "http://example.com/reset-password");
    console.log("Test email sent successfully!");
  } catch (error) {
    console.error("Error during test email:", error);
  }
})();
