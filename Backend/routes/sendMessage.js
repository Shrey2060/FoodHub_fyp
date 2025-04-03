import React, { useState } from "react";
import axios from "axios";

const SendMessage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Validate fields before submission
        if (!name.trim() || !email.trim() || !message.trim()) {
            setFeedback({ type: "error", message: "All fields are required." });
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post("http://localhost:5000/api/contact", {
                name,
                email,
                message,
            });

            if (response.data.success) {
                setFeedback({ type: "success", message: "Message sent successfully!" });
                setName("");
                setEmail("");
                setMessage("");
            }
        } catch (error) {
            console.error("❌ Error sending message:", error);
            setFeedback({ type: "error", message: "Failed to send message. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="send-message-container">
            <h2>Send us a Message</h2>
            {feedback && (
                <p className={feedback.type === "error" ? "error-text" : "success-text"}>
                    {feedback.message}
                </p>
            )}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Your Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                ></textarea>
                <button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Submit"}
                </button>
            </form>
        </div>
    );
};

export default SendMessage;
