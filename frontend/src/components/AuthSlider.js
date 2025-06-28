import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import '../styles/pages/AuthSlider.css';

const AuthSlider = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const location = useLocation();

  // Set initial mode based on route
  useEffect(() => {
    setIsRegisterMode(location.pathname === '/register');
  }, [location.pathname]);

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
  };

  return (
    <div className="auth-page">
      <div className={`auth-container ${isRegisterMode ? 'active register-mode' : ''}`}>
        {/* Login Form */}
        <div className="auth-form-box login">
          <Login isSliderMode={true} />
        </div>

        {/* Register Form */}
        <div className="auth-form-box register">
          <Register isSliderMode={true} />
        </div>

        {/* Toggle Panels */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Hello, Welcome!</h1>
            <p>Don't have an account?</p>
            <button className="btn" onClick={toggleMode}>
              Register
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button className="btn" onClick={toggleMode}>
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSlider;