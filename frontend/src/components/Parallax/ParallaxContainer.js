// frontend/src/components/Parallax/ParallaxContainer.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Context for managing parallax state across components
const ParallaxContext = createContext();

export const useParallaxContext = () => {
  const context = useContext(ParallaxContext);
  if (!context) {
    return {
      isEnabled: true,
      isSupported: true,
      performance: 'high'
    };
  }
  return context;
};

const ParallaxContainer = ({ children, disabled = false }) => {
  const [isEnabled, setIsEnabled] = useState(!disabled);
  const [isSupported, setIsSupported] = useState(true);
  const [performance, setPerformance] = useState('high');

  useEffect(() => {
    // Check device capabilities and user preferences
    const checkSupport = () => {
      const isMobile = window.innerWidth < 768;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isSlowDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
      
      // Disable parallax on mobile or if user prefers reduced motion
      if (isMobile || prefersReducedMotion) {
        setIsEnabled(false);
        setIsSupported(false);
      }
      
      // Adjust performance based on device capabilities
      if (isSlowDevice) {
        setPerformance('low');
      }
    };

    checkSupport();

    // Listen for resize and preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => checkSupport();
    
    mediaQuery.addListener(handleChange);
    window.addEventListener('resize', handleChange);

    return () => {
      mediaQuery.removeListener(handleChange);
      window.removeEventListener('resize', handleChange);
    };
  }, []);

  const contextValue = {
    isEnabled: isEnabled && isSupported,
    isSupported,
    performance,
    setEnabled: setIsEnabled
  };

  return (
    <ParallaxContext.Provider value={contextValue}>
      {children}
    </ParallaxContext.Provider>
  );
};

export default ParallaxContainer;