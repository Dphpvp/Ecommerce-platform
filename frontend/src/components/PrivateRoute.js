import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  
  // FIXED: Wait for authentication to initialize (fallback if initialized doesn't exist)
  if (loading || (initialized !== undefined && !initialized)) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  // FIXED: Only redirect if we're sure there's no user
  if (!user) {
    console.log('🔒 PrivateRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ PrivateRoute: User authenticated, rendering children');
  }
  return children;
};

export default PrivateRoute;