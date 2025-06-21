// frontend/src/components/Parallax/ParallaxSection.js - Enhanced Version
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParallax, useIntersectionObserver } from '../../hooks/useParallax';
import { useParallaxContext } from './ParallaxContainer';
import './ParallaxSection.css';

const ParallaxSection = ({ 
  children, 
  backgroundImage, 
  speed = -0.5, 
  className = '', 
  overlay = false,
  overlayOpacity = 0.3,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  height = '100vh',
  loading = false,
  fallbackColor = '#f5f5f5',
  priority = false // For above-the-fold images
}) => {
  const { isEnabled, performance } = useParallaxContext();
  const [imageLoaded, setImageLoaded] = useState(!backgroundImage);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef(null);
  
  // Adjust speed based on performance mode
  const adjustedSpeed = performance === 'low' ? speed * 0.5 : speed;
  
  const { elementRef: parallaxRef, offset } = useParallax(
    isEnabled ? adjustedSpeed : 0
  );
  
  const { elementRef: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px 0px'
  });

  // Preload background image
  useEffect(() => {
    if (!backgroundImage) return;

    const img = new Image();
    imageRef.current = img;
    
    img.onload = () => setImageLoaded(true);
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(true); // Still set to true to remove loading state
    };
    
    // Add loading priority for above-the-fold images
    if (priority) {
      img.loading = 'eager';
    }
    
    img.src = backgroundImage;

    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, [backgroundImage, priority]);

  // Combine refs
  const setRefs = useCallback((node) => {
    parallaxRef.current = node;
    intersectionRef.current = node;
  }, [parallaxRef, intersectionRef]);

  const sectionStyle = {
    height,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: imageError ? fallbackColor : 'transparent'
  };

  const backgroundStyle = {
    backgroundImage: (backgroundImage && imageLoaded && !imageError) 
      ? `url(${backgroundImage})` 
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: isEnabled ? 'fixed' : 'scroll',
    transform: isEnabled ? `translate3d(0, ${offset}px, 0)` : 'none',
    willChange: (isIntersecting && isEnabled) ? 'transform' : 'auto',
    position: 'absolute',
    top: '-10%',
    left: 0,
    right: 0,
    bottom: '-10%',
    zIndex: 1,
    backgroundColor: imageError ? fallbackColor : 'transparent'
  };

  const overlayStyle = overlay ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: overlayColor.includes('rgba') 
      ? overlayColor.replace(/[\d.]+\)$/g, `${overlayOpacity})`)
      : `rgba(0, 0, 0, ${overlayOpacity})`,
    zIndex: 2,
  } : {};

  const contentStyle = {
    position: 'relative',
    zIndex: 3,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  };

  const isLoading = loading || (backgroundImage && !imageLoaded);

  return (
    <section 
      ref={setRefs}
      className={`parallax-section ${className} ${isLoading ? 'loading' : ''} ${isIntersecting ? 'in-viewport' : ''}`}
      style={sectionStyle}
      role="banner"
      aria-label={backgroundImage ? 'Background image section' : 'Content section'}
    >
      {/* Background Layer */}
      {(backgroundImage && !imageError) && (
        <div 
          className="parallax-background"
          style={backgroundStyle}
          aria-hidden="true"
        />
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div 
          className="parallax-loading"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            background: `linear-gradient(45deg, ${fallbackColor} 25%, #e0e0e0 25%, #e0e0e0 50%, ${fallbackColor} 50%, ${fallbackColor} 75%, #e0e0e0 75%, #e0e0e0)`,
            backgroundSize: '20px 20px',
            animation: 'loading-shimmer 1s ease-in-out infinite'
          }}
          aria-label="Loading background image"
        />
      )}
      
      {/* Overlay Layer */}
      {overlay && <div className="parallax-overlay" style={overlayStyle} aria-hidden="true" />}
      
      {/* Content Layer */}
      <div className="parallax-content" style={contentStyle}>
        {children}
      </div>
      
      {/* Error State */}
      {imageError && backgroundImage && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '0.9rem',
            zIndex: 4,
            textAlign: 'center',
            opacity: 0.7
          }}
          aria-live="polite"
        >
          Background image failed to load
        </div>
      )}
    </section>
  );
};

export default ParallaxSection;