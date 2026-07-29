import React, { useState, useEffect } from 'react';
import '../style/Donor.css';
import apis from '../utils/apis';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/navbar/Footer';
import toast from "react-hot-toast";
import { useNavigate } from 'react-router-dom';
import locationData from "../init/data";

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const DonorForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    bloodGroup: '',
    mobileNumber: '',
    country: '',
    state: '',
    district: '',
    city: '',
    email: '',
    password: '',
    retypePassword: '',
    isAvailable: false,
    authorize: false,
  });

  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaptchaCode(code);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Password match check
    if (formData.password !== formData.retypePassword) {
      toast.error('Passwords do not match!');
      return;
    }

    // Captcha check
    if (captchaInput.toUpperCase() !== captchaCode) {
      setCaptchaError(true);
      generateCaptcha();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCaptchaError(false);

    // Basic validations
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(apis().list1.donorRegister, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Submission failed");

      toast.success(result?.message || "Donor registered successfully");
      console.log(result);

      // Clear form
      setFormData({
        fullName: '',
        bloodGroup: '',
        mobileNumber: '',
        country: '',
        state: '',
        district: '',
        city: '',
        email: '',
        password: '',
        retypePassword: '',
        isAvailable: false,
        authorize: false,
      });
      setCaptchaInput('');
      generateCaptcha();

      navigate("/home");
    } catch (error) {
      toast.error(error.message || "Error submitting form");
      console.error('Error submitting form', error);
    } finally {
      setLoading(false);
    }
  };

  const getStates = () =>
    formData.country ? Object.keys(locationData[formData.country] || {}) : [];

  const getDistricts = () =>
    formData.state ? Object.keys(locationData[formData.country]?.[formData.state] || {}) : [];

  const getCities = () =>
    formData.district
      ? locationData[formData.country]?.[formData.state]?.[formData.district] || []
      : [];

  return (
    <div>
      <Navbar />
      <form onSubmit={handleSubmit} className="form-container">
        <h2 className="form-title">DONOR REGISTRATION FORM</h2>

        <label className="form-label">Full Name:</label>
        <input name="fullName" value={formData.fullName} onChange={handleChange} required className="form-input" />

        <label className="form-label">Blood Group:</label>
        <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required className="form-select">
          <option value="">-----Select-----</option>
          {bloodGroups.map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>

        <label className="form-label">Mobile Number:</label>
        <input
          name="mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          required
          placeholder="Don't add 0 except Malaysia"
          className="form-input"
        />

        <label className="form-label">Select Country:</label>
        <select name="country" value={formData.country} onChange={handleChange} required className="form-select">
          <option value="">-----Select-----</option>
          {Object.keys(locationData).map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        <label className="form-label">Select State:</label>
        <select name="state" value={formData.state} onChange={handleChange} required className="form-select">
          <option value="">-----Select-----</option>
          {getStates().map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        <label className="form-label">Select District:</label>
        <select name="district" value={formData.district} onChange={handleChange} required className="form-select">
          <option value="">-----Select-----</option>
          {getDistricts().map((district) => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>

        <label className="form-label">Select City:</label>
        <select name="city" value={formData.city} onChange={handleChange} required className="form-select">
          <option value="">-----Select-----</option>
          {getCities().map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <label className="form-label">Email ID:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" />

        <label className="form-label">Password:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="form-input" />

        <label className="form-label">Re-type Password:</label>
        <input type="password" name="retypePassword" value={formData.retypePassword} onChange={handleChange} required className="form-input" />

        <label className="form-label">Are you available to donate blood?</label>
        <select
          name="isAvailable"
          value={formData.isAvailable ? 'Yes' : 'No'}
          onChange={(e) => setFormData((prev) => ({ ...prev, isAvailable: e.target.value === 'Yes' }))}
          className="form-select"
        >
          <option value="No">Not Available</option>
          <option value="Yes">Available</option>
        </select>

        <label className="form-label">Enter Captcha Code:</label>
        <div className="captcha-container">
          <div className="captcha-code">{captchaCode}</div>
          <button type="button" onClick={generateCaptcha} className="refresh-button">↻ Refresh</button>
        </div>

        <input
          type="text"
          name="captchaInput"
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value)}
          required
          className="form-input"
        />
        {captchaError && <p className="captcha-error">Captcha does not match. Please try again.</p>}

        <label className="checkbox-label">
          <input type="checkbox" name="authorize" checked={formData.authorize} onChange={handleChange} required />
          I authorise this website to display my name and telephone number for emergencies.
        </label>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
      <Footer />
    </div>
  );
};

export default DonorForm;
