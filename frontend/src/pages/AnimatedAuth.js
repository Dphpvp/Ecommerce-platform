import React from 'react';
import { useLocation } from 'react-router-dom';
import AnimatedAuthContainer from '../components/AnimatedAuthContainer';
import Login from './Login';
import Register from './Register';

const AnimatedAuth = () => {
  const location = useLocation();
  const isLoginMode = !location.pathname.includes('register');

  return (
    <AnimatedAuthContainer mode={isLoginMode ? 'login' : 'register'}>
      {isLoginMode ? <Login /> : <Register />}
    </AnimatedAuthContainer>
  );
};

export default AnimatedAuth;