import React from "react";
import Header from "../Header";
import SendMessage from "../SendMessage/SendMessage";
import "./Contact.css";

const Contact = () => {
  return (
    <>
      <Header />
      <div className="contact-container">
        <h1>Contact Us</h1>
        <p>
          Have questions, feedback, or inquiries? Whether you need assistance
          with an order, want to collaborate, or just have a suggestion, our
          team is here to help. Reach out to us through the form below, email,
          or phone, and we'll get back to you as soon as possible. Your
          satisfaction is our priority, and we're committed to providing you
          with the best experience. Let's connect!
        </p>
        <SendMessage />
      </div>
    </>
  );
};

export default Contact;
