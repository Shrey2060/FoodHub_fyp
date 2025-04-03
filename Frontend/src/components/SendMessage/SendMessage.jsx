import React from 'react';
import "./SendMessage.css";

const SendMessage = () => {
  return (
    <div className="msg-container">
      <div className="msg-box">
        <h2>Send a Message</h2>

        <form className="msg-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email Address" required />
          <textarea placeholder="Your Message" required></textarea>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default SendMessage;
