import React from 'react'
import './backtologin.css'
import { FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

const BackToLogin = () => {

  const navigate = useNavigate();
  const navigateHandler = () => {
    navigate('/login');
  };


  return (
    <div onClick={navigateHandler} className='ui_backToLogin'>
      <FaArrowLeft />
      <span>
        Back to Login
      </span>
    </div>
  )
}

export default BackToLogin
