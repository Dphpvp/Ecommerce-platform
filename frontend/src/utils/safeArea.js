// Safe Area Utilities for Notched Devices
import platformDetection from './platformDetection';

class SafeAreaManager {
  constructor() {
    this.insets = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
    
    this.isSupported = this.checkSupport();
    this.callbacks = new Set();
    
    if (this.isSupported) {
      this.initializeSafeArea();
      this.setupListeners();
    }
  }

  // Check if safe area is supported
  checkSupport() {
    // Check for CSS env() support
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return CSS.supports('padding-top', 'env(safe-area-inset-top)') ||
             CSS.supports('padding-top', 'constant(safe-area-inset-top)');
    }
    
    // Fallback detection for iOS Safari
    return /iPhone|iPad|iPod/.test(navigator.userAgent) && 
           window.screen && 
           (window.screen.height === 812 || // iPhone X
            window.screen.height === 896 || // iPhone XR/XS Max
            window.screen.height === 844 || // iPhone 12/13
            window.screen.height === 926);  // iPhone 12/13 Pro Max
  }

  // Initialize safe area with CSS custom properties
  initializeSafeArea() {
    this.updateCSSProperties();
    this.detectInsets();
  }

  // Update CSS custom properties for safe area
  updateCSSProperties() {
    const root = document.documentElement;
    
    // Set CSS variables for safe area insets
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');
    
    // Fallback for older devices
    root.style.setProperty('--safe-area-inset-top-fallback', 'constant(safe-area-inset-top, 0px)');
    root.style.setProperty('--safe-area-inset-bottom-fallback', 'constant(safe-area-inset-bottom, 0px)');
    root.style.setProperty('--safe-area-inset-left-fallback', 'constant(safe-area-inset-left, 0px)');
    root.style.setProperty('--safe-area-inset-right-fallback', 'constant(safe-area-inset-right, 0px)');
  }

  // Detect safe area insets programmatically
  detectInsets() {
    if (!this.isSupported) return;

    // Create a test element to measure insets
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      visibility: hidden;
      z-index: -1;
      padding-top: env(safe-area-inset-top, constant(safe-area-inset-top, 0px));
      padding-bottom: env(safe-area-inset-bottom, constant(safe-area-inset-bottom, 0px));
      padding-left: env(safe-area-inset-left, constant(safe-area-inset-left, 0px));
      padding-right: env(safe-area-inset-right, constant(safe-area-inset-right, 0px));
    `;
    
    document.body.appendChild(testElement);
    
    // Measure the computed padding
    const computedStyle = window.getComputedStyle(testElement);
    this.insets = {
      top: parseInt(computedStyle.paddingTop, 10) || 0,
      bottom: parseInt(computedStyle.paddingBottom, 10) || 0,
      left: parseInt(computedStyle.paddingLeft, 10) || 0,
      right: parseInt(computedStyle.paddingRight, 10) || 0,
    };
    
    document.body.removeChild(testElement);
    
    // Notify callbacks
    this.notifyCallbacks();
  }

  // Setup event listeners for orientation changes
  setupListeners() {
    const handleResize = () => {
      setTimeout(() => {
        this.detectInsets();
      }, 100); // Delay to ensure layout is updated
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Listen for viewport changes on mobile
    if ('visualViewport' in window) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
  }

  // Get current safe area insets
  getInsets() {
    return { ...this.insets };
  }

  // Check if device has safe area (notch/dynamic island)
  hasSafeArea() {
    return this.insets.top > 0 || this.insets.bottom > 0;
  }

  // Get safe area class names for styling
  getSafeAreaClasses() {
    const classes = [];
    
    if (this.hasSafeArea()) {
      classes.push('has-safe-area');
    }
    
    if (this.insets.top > 0) {
      classes.push('has-top-notch');
    }
    
    if (this.insets.bottom > 0) {
      classes.push('has-bottom-safe-area');
    }
    
    return classes;
  }

  // Apply safe area to element
  applySafeArea(element, options = {}) {
    if (!element || !this.isSupported) return;
    
    const {
      top = true,
      bottom = true,
      left = true,
      right = true,
      property = 'padding',
      important = false
    } = options;
    
    const importantStr = important ? ' !important' : '';
    
    if (top) {
      element.style.setProperty(
        `${property}-top`,
        `calc(var(--${property}-top, 0px) + var(--safe-area-inset-top))${importantStr}`
      );
    }
    
    if (bottom) {
      element.style.setProperty(
        `${property}-bottom`,
        `calc(var(--${property}-bottom, 0px) + var(--safe-area-inset-bottom))${importantStr}`
      );
    }
    
    if (left) {
      element.style.setProperty(
        `${property}-left`,
        `calc(var(--${property}-left, 0px) + var(--safe-area-inset-left))${importantStr}`
      );
    }
    
    if (right) {
      element.style.setProperty(
        `${property}-right`,
        `calc(var(--${property}-right, 0px) + var(--safe-area-inset-right))${importantStr}`
      );
    }
  }

  // Add callback for safe area changes
  onChange(callback) {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Notify all callbacks
  notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback(this.insets);
      } catch (error) {
        console.error('Safe area callback error:', error);
      }
    });
  }

  // Get viewport height excluding safe areas
  getViewportHeight() {
    if (!this.isSupported) {
      return window.innerHeight;
    }
    
    return window.innerHeight - this.insets.top - this.insets.bottom;
  }

  // Get viewport width excluding safe areas
  getViewportWidth() {
    if (!this.isSupported) {
      return window.innerWidth;
    }
    
    return window.innerWidth - this.insets.left - this.insets.right;
  }

  // Update meta viewport for better safe area handling
  updateViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    
    // Update viewport to support safe area
    viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no';
  }

  // Initialize viewport for safe area support
  initializeViewport() {
    // Only update if we're on a mobile device
    if (platformDetection.isMobile) {
      this.updateViewport();
    }
  }
}

// Create singleton instance
const safeAreaManager = new SafeAreaManager();

// React hook for safe area
export const useSafeArea = (options = {}) => {
  const [insets, setInsets] = React.useState(safeAreaManager.getInsets());
  
  React.useEffect(() => {
    const unsubscribe = safeAreaManager.onChange(setInsets);
    return unsubscribe;
  }, []);
  
  return {
    insets,
    hasSafeArea: safeAreaManager.hasSafeArea(),
    classes: safeAreaManager.getSafeAreaClasses(),
    viewportHeight: safeAreaManager.getViewportHeight(),
    viewportWidth: safeAreaManager.getViewportWidth(),
  };
};

// React component for safe area wrapper
export const SafeAreaView = ({ 
  children, 
  edges = ['top', 'bottom', 'left', 'right'],
  style = {},
  className = '' 
}) => {
  const safeAreaClasses = safeAreaManager.getSafeAreaClasses();
  
  const safeAreaStyle = {};
  
  if (edges.includes('top')) {
    safeAreaStyle.paddingTop = 'var(--safe-area-inset-top)';
  }
  if (edges.includes('bottom')) {
    safeAreaStyle.paddingBottom = 'var(--safe-area-inset-bottom)';
  }
  if (edges.includes('left')) {
    safeAreaStyle.paddingLeft = 'var(--safe-area-inset-left)';
  }
  if (edges.includes('right')) {
    safeAreaStyle.paddingRight = 'var(--safe-area-inset-right)';
  }
  
  return React.createElement('div', {
    className: `safe-area-view ${safeAreaClasses.join(' ')} ${className}`,
    style: { ...safeAreaStyle, ...style }
  }, children);
};

// Initialize viewport on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      safeAreaManager.initializeViewport();
    });
  } else {
    safeAreaManager.initializeViewport();
  }
}

// Export utilities
export const applySafeArea = (element, options) => safeAreaManager.applySafeArea(element, options);
export const getSafeAreaInsets = () => safeAreaManager.getInsets();
export const hasSafeArea = () => safeAreaManager.hasSafeArea();
export const getSafeAreaClasses = () => safeAreaManager.getSafeAreaClasses();
export const onSafeAreaChange = (callback) => safeAreaManager.onChange(callback);

export default safeAreaManager;