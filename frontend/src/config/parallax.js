// frontend/src/config/parallax.js - Parallax Configuration
export const parallaxConfig = {
  // Performance settings
  performance: {
    enableOnMobile: false,
    enableOnLowEnd: false,
    maxElements: 10, // Maximum parallax elements on page
    throttleDelay: 16, // ~60fps
    reducedMotionFallback: true
  },

  // Default speeds for different content types
  speeds: {
    background: -0.5,
    hero: -0.3,
    text: -0.2,
    image: -0.4,
    slow: -0.1,
    medium: -0.3,
    fast: -0.6
  },

  // Animation settings
  animations: {
    duration: 800,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    stagger: 100,
    threshold: 0.1
  },

  // Intersection observer settings
  observer: {
    rootMargin: '50px 0px',
    threshold: [0, 0.1, 0.5, 1]
  },

  // Breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  },

  // Image settings
  images: {
    lazyLoading: true,
    placeholderColor: '#f5f5f5',
    fadeInDuration: 300,
    retryAttempts: 3
  },

  // Accessibility
  accessibility: {
    respectReducedMotion: true,
    provideFallbacks: true,
    announceChanges: false
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  parallaxConfig.performance.throttleDelay = 32; // Lower performance for development
}

// Device-specific optimizations
export const getOptimizedConfig = () => {
  const config = { ...parallaxConfig };
  
  // Check device capabilities
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const isMobile = window.innerWidth < config.breakpoints.mobile;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isLowEnd || isMobile || prefersReducedMotion) {
    config.performance.enableOnMobile = false;
    config.performance.maxElements = 5;
    config.performance.throttleDelay = 64; // ~15fps
    config.animations.duration = 400;
    config.animations.stagger = 50;
  }

  return config;
};

export default parallaxConfig;