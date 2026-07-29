import React from "react";
import "./Footer.css";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section about">
          <h3>HopeGivers</h3>
          <p>
            HopeGivers is a life-saving blood donation platform that directly
            connects donors with recipients in need. Together, we save lives.
          </p>
        </div>

        <div className="footer-section links">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="/aboutus">About Us</a>
            </li>
            <li>
              <a href="/find-blood">Find Blood</a>
            </li>

            <li>
              <a href="/feedback/form">Feedback</a>
            </li>
            <li>
              <a href="/contactus">Contact</a>
            </li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h4>Contact Us</h4>
          <p>
            <FaMapMarkerAlt /> CV Paul Boys Hostel, Etawah, India
          </p>
          <p>
            <FaPhoneAlt /> +91 8081525347
          </p>
          <p>
            <FaEnvelope /> hopegivers9@gmail.com
          </p>
        </div>

        <div className="footer-section social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} HopeGivers. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
