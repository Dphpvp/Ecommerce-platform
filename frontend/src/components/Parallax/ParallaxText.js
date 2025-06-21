// frontend/src/components/Parallax/ParallaxText.js
import React, { useEffect, useState } from 'react';
import { useParallax, useScrollAnimation } from '../../hooks/useParallax';
import { useParallaxContext } from './ParallaxContainer';

const ParallaxText = ({
  children,
  speed = -0.2,
  className = '',
  style = {},
  animationType = 'parallax', // 'parallax', 'fadeIn', 'slideUp', 'slideLeft', 'slideRight'
  delay = 0,
  duration = 800,
  stagger = 100, // For word/character animations
  splitBy = 'words', // 'words', 'characters', 'lines'
  ...props
}) => {
  const { isEnabled } = useParallaxContext();
  const [textElements, setTextElements] = useState([]);
  
  const { elementRef: parallaxRef, offset } = useParallax(
    isEnabled && animationType === 'parallax' ? speed : 0
  );
  
  const { elementRef: animationRef, isVisible, hasAnimated } = useScrollAnimation(0.2);

  // Split text into animatable elements
  useEffect(() => {
    if (typeof children !== 'string' || animationType === 'parallax') return;

    let elements = [];
    
    switch (splitBy) {
      case 'characters':
        elements = children.split('').map((char, index) => ({
          content: char === ' ' ? '\u00A0' : char, // Non-breaking space
          index,
          delay: delay + (index * stagger)
        }));
        break;
        
      case 'words':
        elements = children.split(' ').map((word, index) => ({
          content: word,
          index,
          delay: delay + (index * stagger)
        }));
        break;
        
      case 'lines':
        elements = children.split('\n').map((line, index) => ({
          content: line,
          index,
          delay: delay + (index * stagger)
        }));
        break;
        
      default:
        elements = [{ content: children, index: 0, delay }];
    }
    
    setTextElements(elements);
  }, [children, splitBy, delay, stagger, animationType]);

  // Combine refs
  const setRefs = (node) => {
    parallaxRef.current = node;
    animationRef.current = node;
  };

  // Base styles
  const baseStyle = {
    ...style,
    display: 'inline-block',
  };

  // Parallax animation
  if (animationType === 'parallax' && isEnabled) {
    return (
      <span
        ref={setRefs}
        className={`parallax-text ${className}`}
        style={{
          ...baseStyle,
          transform: `translate3d(0, ${offset}px, 0)`,
          willChange: 'transform'
        }}
        {...props}
      >
        {children}
      </span>
    );
  }

  // Scroll-triggered animations
  const getAnimationStyle = (element, index) => {
    const isAnimated = hasAnimated || isVisible;
    const elementDelay = element.delay;
    
    const baseAnimationStyle = {
      display: splitBy === 'characters' ? 'inline' : 'inline-block',
      transition: `all ${duration}ms cubic-bezier(0.23, 1, 0.32, 1)`,
      transitionDelay: `${elementDelay}ms`,
    };

    if (!isAnimated) {
      switch (animationType) {
        case 'fadeIn':
          return {
            ...baseAnimationStyle,
            opacity: 0,
            transform: 'translateY(20px)',
          };
        case 'slideUp':
          return {
            ...baseAnimationStyle,
            opacity: 0,
            transform: 'translateY(50px)',
          };
        case 'slideLeft':
          return {
            ...baseAnimationStyle,
            opacity: 0,
            transform: 'translateX(-50px)',
          };
        case 'slideRight':
          return {
            ...baseAnimationStyle,
            opacity: 0,
            transform: 'translateX(50px)',
          };
        default:
          return baseAnimationStyle;
      }
    }

    // Animated state
    return {
      ...baseAnimationStyle,
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
    };
  };

  // Render split text with animations
  if (textElements.length > 0 && animationType !== 'parallax') {
    return (
      <span
        ref={setRefs}
        className={`parallax-text parallax-text-${animationType} ${className}`}
        style={baseStyle}
        {...props}
      >
        {textElements.map((element, index) => (
          <span
            key={index}
            style={getAnimationStyle(element, index)}
            className={`text-element text-element-${index}`}
          >
            {element.content}
            {splitBy === 'words' && index < textElements.length - 1 && ' '}
          </span>
        ))}
      </span>
    );
  }

  // Fallback: simple text without animations
  return (
    <span
      ref={setRefs}
      className={`parallax-text ${className}`}
      style={baseStyle}
      {...props}
    >
      {children}
    </span>
  );
};

export default ParallaxText;