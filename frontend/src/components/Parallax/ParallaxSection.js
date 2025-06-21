// frontend/src/components/Parallax/ParallaxSection.js
import React from 'react';
import { useParallax, useIntersectionObserver } from '../../hooks/useParallax';
import './ParallaxSection.css';

const ParallaxSection = ({ 
  children, 
  backgroundImage, 
  speed = -0.5, 
  className = '', 
  overlay = false,
  overlayOpacity = 0.3,
  height = '100vh'
}) => {
  const { elementRef: parallaxRef, offset } = useParallax(speed);
  const { elementRef: intersectionRef, isIntersecting } = useIntersectionObserver();

  const sectionStyle = {
    height,
    overflow: 'hidden',
    position: 'relative',
  };

  const backgroundStyle = {
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    transform: `translate3d(0, ${offset}px, 0)`,
    willChange: isIntersecting ? 'transform' : 'auto',
    position: 'absolute',
    top: '-10%',
    left: 0,
    right: 0,
    bottom: '-10%',
    zIndex: 1,
  };

  const overlayStyle = overlay ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
    zIndex: 2,
  } : {};

  const contentStyle = {
    position: 'relative',
    zIndex: 3,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <section 
      ref={(node) => {
        parallaxRef.current = node;
        intersectionRef.current = node;
      }}
      className={`parallax-section ${className}`}
      style={sectionStyle}
    >
      {backgroundImage && (
        <div 
          className="parallax-background"
          style={backgroundStyle}
        />
      )}
      {overlay && <div className="parallax-overlay" style={overlayStyle} />}
      <div className="parallax-content" style={contentStyle}>
        {children}
      </div>
    </section>
  );
};

export default ParallaxSection;


