import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Register from './components/auth/Register';
import Login from './components/auth/Login';
import ForgetPassword from './components/auth/ForgetPassword';
import VerifyOtp from './components/auth/VerifyOtp';
import UpdatePassword from './components/auth/UpdatePassword';

import Home from './Home';
import RegistrationForm from './pages/Donor';
import ReceiverForm from './pages/Receiver';
import Feedback from "./pages/Feedback";
import ContactUs from "./pages/Contact";
import AboutUs from "./pages/About";

import Super from './components/Super';           // Handles OTP/Password token access
import PrivateRoute from './components/PrivateRoute';  // Handles main login token access
import Footer from './components/navbar/Footer';

const App = () => {
  return (
    <Routes>
      {/* 🔁 Redirect base path to login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* 🔐 Public Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forget/password" element={<ForgetPassword />} />

      {/* 🔒 Special Protected OTP Routes (passToken based) */}
      <Route element={<Super />}>
        <Route path="/otp/verify" element={<VerifyOtp />} />
        <Route path="/password/update" element={<UpdatePassword />} />
      </Route>

      {/* 🔒 Authenticated User Routes (token based) */}
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/donor/register" element={<PrivateRoute><RegistrationForm /></PrivateRoute>} />

      {/* 🧾 Open Pages (optional: make them PrivateRoute too if needed) */}
      <Route path="/donor/search-donors" element={<ReceiverForm />} />
      <Route path="/feedback/form" element={<PrivateRoute><Feedback /></PrivateRoute>} />
      <Route path="/contactus" element={<PrivateRoute><ContactUs /></PrivateRoute>} />
      <Route path="/aboutus" element={<AboutUs />} />
    </Routes>
  );
  <Footer />;
};

export default App;
