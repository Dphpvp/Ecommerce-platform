// frontend/src/hooks/useParallax.js - Enhanced Version
import { useEffect, useRef, useState, useCallback } from 'react';

// Performance-optimized throttle function
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// RequestAnimationFrame-based throttle for smooth animations
const rafThrottle = (func) => {
  let rafId = null;
  return (...args) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
    }
  };
};

export const useParallax = (speed = -0.5, disabled = false) => {
  const elementRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [isInViewport, setIsInViewport] = useState(false);
  const animationFrameRef = useRef(null);

  // Memoized calculation function
  const calculateOffset = useCallback((scrollY, elementTop, elementHeight, windowHeight) => {
    // Only calculate if element is near viewport
    const elementBottom = elementTop + elementHeight;
    const viewportTop = scrollY - windowHeight * 0.5; // Extended viewport
    const viewportBottom = scrollY + windowHeight * 1.5;
    
    // Check if element is in extended viewport
    const inExtendedViewport = elementBottom >= viewportTop && elementTop <= viewportBottom;
    
    if (!inExtendedViewport) {
      return { offset: 0, inViewport: false };
    }
    
    // Calculate parallax offset
    const elementCenter = elementTop + elementHeight / 2;
    const viewportCenter = scrollY + windowHeight / 2;
    const distanceFromCenter = elementCenter - viewportCenter;
    const parallaxOffset = distanceFromCenter * speed;
    
    // Check if actually in viewport (not extended)
    const actuallyInViewport = elementBottom >= scrollY && elementTop <= scrollY + windowHeight;
    
    return { 
      offset: Math.round(parallaxOffset * 100) / 100, // Round for performance
      inViewport: actuallyInViewport 
    };
  }, [speed]);

  // Optimized update function with RAF throttling
  const updateTransform = useCallback(rafThrottle(() => {
    const element = elementRef.current;
    if (!element || disabled) return;

    const rect = element.getBoundingClientRect();
    const scrollY = window.pageYOffset;
    const elementTop = rect.top + scrollY;
    const elementHeight = rect.height;
    const windowHeight = window.innerHeight;

    const { offset: newOffset, inViewport } = calculateOffset(
      scrollY, 
      elementTop, 
      elementHeight, 
      windowHeight
    );

    setOffset(newOffset);
    setIsInViewport(inViewport);
  }), [disabled, calculateOffset]);

  useEffect(() => {
    if (disabled) {
      setOffset(0);
      setIsInViewport(false);
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setOffset(0);
      setIsInViewport(false);
      return;
    }

    // Check if device is mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setOffset(0);
      setIsInViewport(false);
      return;
    }

    // Initial calculation
    updateTransform();

    // Optimized scroll listener with passive option
    const handleScroll = updateTransform;
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Throttled resize listener
    const handleResize = throttle(() => {
      // Re-check mobile status
      const nowMobile = window.innerWidth < 768;
      if (nowMobile) {
        setOffset(0);
        setIsInViewport(false);
        return;
      }
      updateTransform();
    }, 100);
    
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [disabled, updateTransform]);

  return { elementRef, offset, isInViewport };
};

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create observer with default options optimized for performance
    const defaultOptions = {
      threshold: [0, 0.1, 0.5, 1], // Multiple thresholds for better control
      rootMargin: '50px 0px', // Extended detection area
      ...options,
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [observerEntry] = entries;
        setIsIntersecting(observerEntry.isIntersecting);
        setEntry(observerEntry);
      },
      defaultOptions
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { elementRef, isIntersecting, entry };
};

// Hook for parallax performance monitoring
export const useParallaxPerformance = () => {
  const [performanceLevel, setPerformanceLevel] = useState('high');
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationFrame;
    
    const measurePerformance = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      // Check FPS every second
      if (currentTime - lastTime.current >= 1000) {
        const fps = frameCount.current;
        frameCount.current = 0;
        lastTime.current = currentTime;
        
        // Adjust performance level based on FPS
        if (fps < 30) {
          setPerformanceLevel('low');
        } else if (fps < 50) {
          setPerformanceLevel('medium');
        } else {
          setPerformanceLevel('high');
        }
      }
      
      animationFrame = requestAnimationFrame(measurePerformance);
    };

    // Start monitoring after a delay to let initial rendering settle
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(measurePerformance);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return performanceLevel;
};

// Utility hook for scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1) => {
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin: '50px 0px'
  });
  
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isIntersecting, hasAnimated]);

  return { elementRef, isVisible: isIntersecting, hasAnimated };
};