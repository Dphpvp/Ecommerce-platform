// frontend/src/utils/parallax.js - Parallax Utilities
import { parallaxConfig } from '../config/parallax';

/**
 * Check if parallax should be enabled based on device and user preferences
 */
export const shouldEnableParallax = () => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion && parallaxConfig.accessibility.respectReducedMotion) {
    return false;
  }

  // Check if mobile
  const isMobile = window.innerWidth < parallaxConfig.breakpoints.mobile;
  if (isMobile && !parallaxConfig.performance.enableOnMobile) {
    return false;
  }

  // Check device capabilities
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  if (isLowEnd && !parallaxConfig.performance.enableOnLowEnd) {
    return false;
  }

  return true;
};

/**
 * Get optimized parallax speed based on performance level
 */
export const getOptimizedSpeed = (baseSpeed, performanceLevel = 'high') => {
  const multipliers = {
    low: 0.3,
    medium: 0.6,
    high: 1.0
  };

  return baseSpeed * (multipliers[performanceLevel] || 1.0);
};

/**
 * Calculate parallax offset with bounds checking
 */
export const calculateParallaxOffset = (
  scrollY,
  elementTop,
  elementHeight,
  windowHeight,
  speed,
  bounds = { min: -500, max: 500 }
) => {
  const elementCenter = elementTop + elementHeight / 2;
  const viewportCenter = scrollY + windowHeight / 2;
  const distanceFromCenter = elementCenter - viewportCenter;
  const offset = distanceFromCenter * speed;

  // Apply bounds to prevent extreme values
  return Math.max(bounds.min, Math.min(bounds.max, offset));
};

/**
 * Preload images for better parallax performance
 */
export const preloadImage = (src, priority = false) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    
    if (priority && 'loading' in img) {
      img.loading = 'eager';
    }
    
    img.src = src;
  });
};

/**
 * Preload multiple images with progress tracking
 */
export const preloadImages = async (images, onProgress) => {
  const total = images.length;
  let loaded = 0;
  const results = [];

  for (const { src, priority } of images) {
    try {
      const img = await preloadImage(src, priority);
      results.push({ src, img, status: 'loaded' });
    } catch (error) {
      results.push({ src, error, status: 'error' });
    } finally {
      loaded++;
      if (onProgress) {
        onProgress({ loaded, total, percentage: (loaded / total) * 100 });
      }
    }
  }

  return results;
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function with requestAnimationFrame
 */
export const rafThrottle = (func) => {
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

/**
 * Check if element is in viewport
 */
export const isElementInViewport = (element, offset = 0) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= windowHeight + offset &&
    rect.right <= windowWidth + offset
  );
};

/**
 * Get scroll progress for an element (0 to 1)
 */
export const getScrollProgress = (element) => {
  if (!element) return 0;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const elementHeight = rect.height;
  
  // Element completely above viewport
  if (rect.bottom < 0) return 1;
  
  // Element completely below viewport
  if (rect.top > windowHeight) return 0;
  
  // Calculate progress
  const totalScrollDistance = windowHeight + elementHeight;
  const currentPosition = windowHeight - rect.top;
  
  return Math.max(0, Math.min(1, currentPosition / totalScrollDistance));
};

/**
 * Create smooth easing functions
 */
export const easingFunctions = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

/**
 * Performance monitoring utility
 */
export class ParallaxPerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.fps = 60;
    this.isMonitoring = false;
  }

  start() {
    this.isMonitoring = true;
    this.measure();
  }

  stop() {
    this.isMonitoring = false;
  }

  measure() {
    if (!this.isMonitoring) return;

    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measure());
  }

  getFPS() {
    return this.fps;
  }

  getPerformanceLevel() {
    if (this.fps >= 50) return 'high';
    if (this.fps >= 30) return 'medium';
    return 'low';
  }
}

/**
 * Viewport size detection
 */
export const getViewportSize = () => {
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  
  return { width, height };
};

/**
 * Device type detection
 */
export const getDeviceType = () => {
  const { width } = getViewportSize();
  const { breakpoints } = parallaxConfig;
  
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'tablet';
  if (width < breakpoints.desktop) return 'desktop';
  return 'large';
};

/**
 * Smooth scroll to element with parallax considerations
 */
export const smoothScrollTo = (element, options = {}) => {
  if (!element) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  };
  
  element.scrollIntoView(defaultOptions);
};

export default {
  shouldEnableParallax,
  getOptimizedSpeed,
  calculateParallaxOffset,
  preloadImage,
  preloadImages,
  debounce,
  rafThrottle,
  isElementInViewport,
  getScrollProgress,
  easingFunctions,
  ParallaxPerformanceMonitor,
  getViewportSize,
  getDeviceType,
  smoothScrollTo
};