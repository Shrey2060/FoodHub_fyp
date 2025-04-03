// NotFound.js
import React from "react";

const NotFound = () => {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <a href="/home">Go to Home</a>
    </div>
  );
};

export default NotFound;