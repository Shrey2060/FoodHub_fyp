import React from 'react'
import { useNavigate } from "react-router-dom";
import "./Footer.css";

const Footer = () => {

  const navigate = useNavigate();

  return (
    <>
      <div className="footer">
        <h4>About FOODHUB</h4>
        <p>Your Favourite food delivery partner.</p>

        <div className='main-container'>

          <div className='link-container'>
            <ul className="links">
              <li><button onClick={() => navigate("/about")}>About Us</button></li>
              <li><button onClick={() => navigate("/contact")}>Contact Us</button></li>
            </ul>
          </div>

          <div className="link-container">
            <ul>
              <li>📞 +977 9844000510</li>
              <li>📧 shrey@foodhub.com</li>
              <li>📍 Inaruwa, Nepal</li>
            </ul>
          </div>

          <div className="link-container">
            <ul>
              <li>Facebook</li>
              <li>Twitter</li>
              <li>Instagram</li>
            </ul>
          </div>
        </div>

        <p>&copy; 2024 FOODHUB. All rights reserved.</p>


      </div>
    </>
  )
}

export default Footer
