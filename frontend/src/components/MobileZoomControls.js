import React, { useState, useEffect } from 'react';
import platformDetection from '../utils/platformDetection';

const MobileZoomControls = () => {
  const [zoomLevel, setZoomLevel] = useState('normal');
  
  useEffect(() => {
    // Only show on mobile devices
    if (!platformDetection.isMobile) return;
    
    // Add mobile-apk class to body for mobile devices
    document.body.classList.add('mobile-apk');
    
    // Load saved zoom level from localStorage
    const savedZoom = localStorage.getItem('mobile_zoom_level') || 'normal';
    setZoomLevel(savedZoom);
    applyZoom(savedZoom);
    
    return () => {
      document.body.classList.remove('mobile-apk', 'zoom-small', 'zoom-normal', 'zoom-large');
    };
  }, []);
  
  const applyZoom = (level) => {
    // Remove all zoom classes
    document.body.classList.remove('zoom-small', 'zoom-normal', 'zoom-large');
    
    // Add the appropriate zoom class
    document.body.classList.add(`zoom-${level}`);
    
    // Save to localStorage
    localStorage.setItem('mobile_zoom_level', level);
    
    // Add haptic feedback for mobile
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  };
  
  const handleZoomIn = () => {
    let newLevel;
    switch (zoomLevel) {
      case 'small':
        newLevel = 'normal';
        break;
      case 'normal':
        newLevel = 'large';
        break;
      case 'large':
        return; // Already at maximum zoom
      default:
        newLevel = 'normal';
    }
    setZoomLevel(newLevel);
    applyZoom(newLevel);
  };
  
  const handleZoomOut = () => {
    let newLevel;
    switch (zoomLevel) {
      case 'large':
        newLevel = 'normal';
        break;
      case 'normal':
        newLevel = 'small';
        break;
      case 'small':
        return; // Already at minimum zoom
      default:
        newLevel = 'normal';
    }
    setZoomLevel(newLevel);
    applyZoom(newLevel);
  };
  
  const handleReset = () => {
    setZoomLevel('normal');
    applyZoom('normal');
  };
  
  // Don't render on desktop
  if (!platformDetection.isMobile) {
    return null;
  }
  
  return (
    <div className="mobile-zoom-controls">
      <button 
        className="zoom-control-btn"
        onClick={handleZoomIn}
        disabled={zoomLevel === 'large'}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      <button 
        className="zoom-control-btn"
        onClick={handleReset}
        title="Reset Zoom"
        aria-label="Reset Zoom"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      <button 
        className="zoom-control-btn"
        onClick={handleZoomOut}
        disabled={zoomLevel === 'small'}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </button>
      
      {/* Zoom level indicator */}
      <div className="zoom-indicator">
        <span className="zoom-level-text">
          {zoomLevel === 'small' && '80%'}
          {zoomLevel === 'normal' && '100%'}
          {zoomLevel === 'large' && '110%'}
        </span>
      </div>
    </div>
  );
};

export default MobileZoomControls;