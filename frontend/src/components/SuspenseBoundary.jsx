import React, { Suspense } from 'react';
import LoadingSpinner, { PageSkeleton } from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

// Enhanced Suspense wrapper with error handling
const SuspenseBoundary = ({ 
  children, 
  fallback = null, 
  loadingText = "Loading...",
  skeleton = false,
  minimal = false 
}) => {
  const defaultFallback = skeleton 
    ? <PageSkeleton />
    : <LoadingSpinner 
        size="medium" 
        text={loadingText} 
        minimal={minimal}
      />;

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Specialized suspense boundaries for different content types
export const PageSuspense = ({ children, title = "page" }) => (
  <SuspenseBoundary 
    loadingText={`Loading ${title}...`}
    skeleton={true}
  >
    {children}
  </SuspenseBoundary>
);

export const ComponentSuspense = ({ children, name = "component" }) => (
  <SuspenseBoundary 
    loadingText={`Loading ${name}...`}
    minimal={true}
  >
    {children}
  </SuspenseBoundary>
);

export const AdminSuspense = ({ children }) => (
  <SuspenseBoundary 
    loadingText="Loading admin panel..."
    fallback={
      <div className="admin-loading-container">
        <LoadingSpinner size="large" text="Loading admin panel..." />
      </div>
    }
  >
    {children}
  </SuspenseBoundary>
);

export const AuthSuspense = ({ children }) => (
  <SuspenseBoundary 
    loadingText="Loading authentication..."
    fallback={
      <div className="auth-loading-container">
        <LoadingSpinner size="medium" text="Loading authentication..." />
      </div>
    }
  >
    {children}
  </SuspenseBoundary>
);

export default SuspenseBoundary;