import React, { useState } from "react";
import "../style/Contact.css";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/navbar/Footer";
import toast from 'react-hot-toast';
import apis from "../utils/apis";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(apis().list1.contactUs, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Thanks ${formData.name}, we’ll contact you shortly!`);
        setFormData({ name: "", email: "", subject: "", message: "" });
        navigate('/home');
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Network error.");
    }
  };

  return (
    <div>
      <Navbar />
      <section className="contact-section">
        <div className="contact-left">
          <h2>Need Help? Contact Us.</h2>
          <p>
            Our team is here to assist you with blood donation, requests, and any inquiries.
          </p>
          <div className="contact-info">
            <p>📞 8081525347</p>
            <p>✉ hopegivers9@gmail.com</p>
          </div>
        </div>

        <div className="contact-right">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                name="name"
                placeholder="e.g. Lukmon Olabode Ilebiiy"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="lukmonilebiyi@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <input
              type="text"
              name="subject"
              placeholder="Subject of mail"
              className="full-width"
              value={formData.subject}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="Tell us more about..."
              rows="5"
              className="full-width"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button type="submit">Contact Us</button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;
