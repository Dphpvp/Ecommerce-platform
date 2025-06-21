import React from 'react';
import { useParallax } from '../../hooks/useParallax';

const ParallaxElement = ({ 
  children, 
  speed = -0.3, 
  className = '',
  disabled = false 
}) => {
  const { elementRef, offset } = useParallax(speed, disabled);

  const style = {
    transform: `translate3d(0, ${offset}px, 0)`,
    willChange: 'transform',
  };

  return (
    <div 
      ref={elementRef}
      className={`parallax-element ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default ParallaxElement;