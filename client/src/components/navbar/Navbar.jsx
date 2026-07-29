import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apis from '../../utils/apis';
import './navbar.css';
import logoImage from '../../assets/HomeImage1.png';

const api = apis();

const Navbar = () => {
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Public routes that don't need token
  const publicPaths = ['/login', '/register', '/forget/password', '/otp/verify', '/password/update'];
  const isPublicRoute = publicPaths.includes(location.pathname.toLowerCase());

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Don't fetch user for public routes
    if (isPublicRoute) return;

    // If no token on protected route, redirect to login
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    // If token present, try to fetch user name
    fetch(api.list1.getHomeData, {
      method: 'GET',  // ✅ Use GET if backend expects it
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status && data.name) {
          setUserName(data.name);
        } else {
          console.log('Token invalid or user not found');
          navigate('/login');
        }
      })
      .catch(err => {
        console.log('API error:', err.message);
        navigate('/login');
      });
  }, [location.pathname, navigate, isPublicRoute]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logoImage} alt="Logo" />
        <span>HopeGivers</span>
      </div>
      <ul className="nav-links">
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/feedback/form">Feedback</Link></li>
        <li><Link to="/contactus">Contact Us</Link></li>
        <li><Link to="/aboutus">About Us</Link></li>
      </ul>
      <div className="right-controls">
        {userName ? (
          <div
            className="profile"
            onClick={() => setShowDropdown(prev => !prev)}
            style={{ cursor: 'pointer' }}
          >
            <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
            {showDropdown && (
              <div className="dropdown">
                <div onClick={() => navigate('/dashboard')}>Dashboard</div>
                <div onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        ) : !isPublicRoute ? (
          <button className="login-btn" onClick={() => navigate('/login')}>
            Login
          </button>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
