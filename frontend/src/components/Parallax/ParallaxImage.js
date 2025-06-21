// frontend/src/components/Parallax/ParallaxImage.js
import React, { useState, useRef, useEffect } from 'react';
import { useParallax, useIntersectionObserver } from '../../hooks/useParallax';
import { useParallaxContext } from './ParallaxContainer';

const ParallaxImage = ({ 
  src,
  alt,
  speed = -0.3,
  className = '',
  style = {},
  width,
  height,
  priority = false,
  fallback,
  onLoad,
  onError,
  ...props
}) => {
  const { isEnabled } = useParallaxContext();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef(null);
  
  const { elementRef: parallaxRef, offset } = useParallax(
    isEnabled ? speed : 0
  );
  
  const { elementRef: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px 0px' // Load images before they come into view
  });

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    imageRef.current = img;
    
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
      onLoad?.(img);
    };
    
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
      onError?.(img);
    };
    
    if (priority) {
      img.loading = 'eager';
    }
    
    img.src = src;
    img.alt = alt || '';

    return () => {
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
  }, [src, alt, priority, onLoad, onError]);

  const setRefs = (node) => {
    parallaxRef.current = node;
    intersectionRef.current = node;
  };

  const imageStyle = {
    ...style,
    transform: isEnabled ? `translate3d(0, ${offset}px, 0)` : 'none',
    willChange: (isIntersecting && isEnabled) ? 'transform' : 'auto',
    transition: 'opacity 0.3s ease, transform 0.1s ease-out',
    opacity: imageLoaded ? 1 : 0,
    width: width || '100%',
    height: height || 'auto',
    display: 'block'
  };

  if (imageError && fallback) {
    return (
      <img
        ref={setRefs}
        src={fallback}
        alt={alt}
        className={`parallax-image ${className}`}
        style={imageStyle}
        {...props}
      />
    );
  }

  if (imageError && !fallback) {
    return (
      <div
        ref={setRefs}
        className={`parallax-image-error ${className}`}
        style={{
          ...imageStyle,
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '0.9rem'
        }}
        role="img"
        aria-label={`Failed to load image: ${alt}`}
      >
        Image not available
      </div>
    );
  }

  return (
    <>
      {/* Loading placeholder */}
      {!imageLoaded && (
        <div
          className={`parallax-image-loading ${className}`}
          style={{
            ...imageStyle,
            background: 'linear-gradient(45deg, #f0f0f0 25%, #e0e0e0 25%, #e0e0e0 50%, #f0f0f0 50%, #f0f0f0 75%, #e0e0e0 75%, #e0e0e0)',
            backgroundSize: '20px 20px',
            animation: 'loading-shimmer 1s ease-in-out infinite',
            opacity: 1
          }}
          aria-label="Loading image"
        />
      )}
      
      {/* Actual image */}
      <img
        ref={setRefs}
        src={src}
        alt={alt}
        className={`parallax-image ${className}`}
        style={imageStyle}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
    </>
  );
};

export default ParallaxImage;