import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  minimal = false 
}) => {
  const sizeClass = {
    small: 'spinner-sm',
    medium: 'spinner-md',
    large: 'spinner-lg'
  }[size];

  if (minimal) {
    return (
      <div className="spinner-minimal">
        <div className={`spinner ${sizeClass}`} />
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-container">
          <div className={`spinner ${sizeClass}`} />
          <p className="spinner-text">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-container">
      <div className={`spinner ${sizeClass}`} />
      <p className="spinner-text">{text}</p>
    </div>
  );
};

// Skeleton components for better UX
export const PageSkeleton = () => (
  <div className="page-skeleton">
    <div className="skeleton-header" />
    <div className="skeleton-content">
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="card-skeleton">
    <div className="skeleton-image" />
    <div className="skeleton-content">
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="table-skeleton">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="skeleton-row">
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell" />
        <div className="skeleton-cell short" />
      </div>
    ))}
  </div>
);

export default LoadingSpinner;