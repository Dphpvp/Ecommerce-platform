// Haptic Feedback Utilities for Mobile Apps
import platformDetection from './platformDetection';

// Haptic feedback types
export const HapticFeedbackType = {
  // iOS Haptic Feedback Types
  LIGHT: 'light',
  MEDIUM: 'medium', 
  HEAVY: 'heavy',
  
  // iOS Notification Types
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  
  // iOS Selection Type
  SELECTION: 'selection',
  
  // Android Vibration Patterns
  CLICK: 'click',
  DOUBLE_CLICK: 'double_click',
  TICK: 'tick',
  REJECT: 'reject',
  KEYBOARD_TAP: 'keyboard_tap',
};

// Vibration patterns for Android (in milliseconds)
const VIBRATION_PATTERNS = {
  [HapticFeedbackType.LIGHT]: [10],
  [HapticFeedbackType.MEDIUM]: [20],
  [HapticFeedbackType.HEAVY]: [30],
  [HapticFeedbackType.SUCCESS]: [10, 100, 10],
  [HapticFeedbackType.WARNING]: [15, 100, 15, 100, 15],
  [HapticFeedbackType.ERROR]: [25, 50, 25, 50, 25],
  [HapticFeedbackType.SELECTION]: [5],
  [HapticFeedbackType.CLICK]: [10],
  [HapticFeedbackType.DOUBLE_CLICK]: [10, 50, 10],
  [HapticFeedbackType.TICK]: [5],
  [HapticFeedbackType.REJECT]: [50],
  [HapticFeedbackType.KEYBOARD_TAP]: [3],
};

class HapticFeedbackManager {
  constructor() {
    this.isSupported = this.checkSupport();
    this.isEnabled = true;
    this.capacitorHaptics = null;
    
    this.initializeCapacitorHaptics();
  }

  // Check if haptic feedback is supported
  checkSupport() {
    // Check for Capacitor Haptics plugin
    if (window.Capacitor?.Plugins?.Haptics) {
      return true;
    }
    
    // Check for native vibration API
    if ('vibrate' in navigator) {
      return true;
    }
    
    // Check for iOS device
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      return true;
    }
    
    return false;
  }

  // Initialize Capacitor Haptics plugin
  async initializeCapacitorHaptics() {
    try {
      if (window.Capacitor?.Plugins?.Haptics) {
        this.capacitorHaptics = window.Capacitor.Plugins.Haptics;
        console.log('✅ Capacitor Haptics initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize Capacitor Haptics:', error);
    }
  }

  // Enable/disable haptic feedback
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    // Store preference in localStorage
    try {
      localStorage.setItem('haptic-feedback-enabled', enabled.toString());
    } catch (error) {
      console.warn('Failed to store haptic preference:', error);
    }
  }

  // Get enabled state from localStorage
  getEnabled() {
    try {
      const stored = localStorage.getItem('haptic-feedback-enabled');
      return stored !== null ? stored === 'true' : true;
    } catch (error) {
      return true;
    }
  }

  // Trigger haptic feedback
  async trigger(type = HapticFeedbackType.LIGHT, options = {}) {
    if (!this.isSupported || !this.isEnabled) {
      return;
    }

    const { force = false, delay = 0 } = options;

    // Add delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      // Use Capacitor Haptics if available
      if (this.capacitorHaptics) {
        await this.triggerCapacitorHaptic(type);
        return;
      }

      // Fallback to native vibration
      await this.triggerNativeVibration(type);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Trigger Capacitor haptic feedback
  async triggerCapacitorHaptic(type) {
    switch (type) {
      case HapticFeedbackType.LIGHT:
        await this.capacitorHaptics.impact({ style: 'LIGHT' });
        break;
      
      case HapticFeedbackType.MEDIUM:
        await this.capacitorHaptics.impact({ style: 'MEDIUM' });
        break;
      
      case HapticFeedbackType.HEAVY:
        await this.capacitorHaptics.impact({ style: 'HEAVY' });
        break;
      
      case HapticFeedbackType.SUCCESS:
        await this.capacitorHaptics.notification({ type: 'SUCCESS' });
        break;
      
      case HapticFeedbackType.WARNING:
        await this.capacitorHaptics.notification({ type: 'WARNING' });
        break;
      
      case HapticFeedbackType.ERROR:
        await this.capacitorHaptics.notification({ type: 'ERROR' });
        break;
      
      case HapticFeedbackType.SELECTION:
        await this.capacitorHaptics.selectionStart();
        setTimeout(() => this.capacitorHaptics.selectionEnd(), 50);
        break;
      
      case HapticFeedbackType.CLICK:
      case HapticFeedbackType.TICK:
        await this.capacitorHaptics.impact({ style: 'LIGHT' });
        break;
      
      case HapticFeedbackType.DOUBLE_CLICK:
        await this.capacitorHaptics.impact({ style: 'LIGHT' });
        setTimeout(() => this.capacitorHaptics.impact({ style: 'LIGHT' }), 100);
        break;
      
      case HapticFeedbackType.KEYBOARD_TAP:
        await this.capacitorHaptics.impact({ style: 'LIGHT' });
        break;
      
      case HapticFeedbackType.REJECT:
        await this.capacitorHaptics.notification({ type: 'ERROR' });
        break;
      
      default:
        await this.capacitorHaptics.impact({ style: 'MEDIUM' });
    }
  }

  // Trigger native vibration as fallback
  async triggerNativeVibration(type) {
    if (!('vibrate' in navigator)) {
      return;
    }

    const pattern = VIBRATION_PATTERNS[type] || VIBRATION_PATTERNS[HapticFeedbackType.MEDIUM];
    navigator.vibrate(pattern);
  }

  // Predefined haptic patterns for common UI interactions
  async buttonPress() {
    await this.trigger(HapticFeedbackType.LIGHT);
  }

  async buttonLongPress() {
    await this.trigger(HapticFeedbackType.MEDIUM);
  }

  async switchToggle() {
    await this.trigger(HapticFeedbackType.SELECTION);
  }

  async success() {
    await this.trigger(HapticFeedbackType.SUCCESS);
  }

  async error() {
    await this.trigger(HapticFeedbackType.ERROR);
  }

  async warning() {
    await this.trigger(HapticFeedbackType.WARNING);
  }

  async swipeAction() {
    await this.trigger(HapticFeedbackType.MEDIUM);
  }

  async pullToRefresh() {
    await this.trigger(HapticFeedbackType.HEAVY);
  }

  async cardFlip() {
    await this.trigger(HapticFeedbackType.MEDIUM, { delay: 100 });
  }

  async keyboardTap() {
    await this.trigger(HapticFeedbackType.KEYBOARD_TAP);
  }

  async dragStart() {
    await this.trigger(HapticFeedbackType.MEDIUM);
  }

  async dragEnd() {
    await this.trigger(HapticFeedbackType.LIGHT);
  }

  async scrollToTop() {
    await this.trigger(HapticFeedbackType.MEDIUM);
  }

  async addToCart() {
    await this.trigger(HapticFeedbackType.SUCCESS);
  }

  async removeFromCart() {
    await this.trigger(HapticFeedbackType.WARNING);
  }

  async orderSuccess() {
    // Success pattern: medium -> light -> light
    await this.trigger(HapticFeedbackType.MEDIUM);
    setTimeout(() => this.trigger(HapticFeedbackType.LIGHT), 200);
    setTimeout(() => this.trigger(HapticFeedbackType.LIGHT), 400);
  }

  async paymentSuccess() {
    await this.trigger(HapticFeedbackType.SUCCESS);
    setTimeout(() => this.trigger(HapticFeedbackType.SUCCESS), 300);
  }

  async navigationBack() {
    await this.trigger(HapticFeedbackType.LIGHT);
  }

  async navigationForward() {
    await this.trigger(HapticFeedbackType.LIGHT);
  }

  async tabSwitch() {
    await this.trigger(HapticFeedbackType.SELECTION);
  }

  async imageZoom() {
    await this.trigger(HapticFeedbackType.LIGHT);
  }

  async modalOpen() {
    await this.trigger(HapticFeedbackType.MEDIUM);
  }

  async modalClose() {
    await this.trigger(HapticFeedbackType.LIGHT);
  }
}

// Create singleton instance
const hapticFeedback = new HapticFeedbackManager();

// React hook for haptic feedback
export const useHapticFeedback = () => {
  const [isEnabled, setIsEnabled] = React.useState(hapticFeedback.getEnabled());

  React.useEffect(() => {
    hapticFeedback.setEnabled(isEnabled);
  }, [isEnabled]);

  return {
    trigger: hapticFeedback.trigger.bind(hapticFeedback),
    isSupported: hapticFeedback.isSupported,
    isEnabled,
    setEnabled: setIsEnabled,
    
    // Convenience methods
    buttonPress: hapticFeedback.buttonPress.bind(hapticFeedback),
    buttonLongPress: hapticFeedback.buttonLongPress.bind(hapticFeedback),
    switchToggle: hapticFeedback.switchToggle.bind(hapticFeedback),
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    warning: hapticFeedback.warning.bind(hapticFeedback),
    swipeAction: hapticFeedback.swipeAction.bind(hapticFeedback),
    pullToRefresh: hapticFeedback.pullToRefresh.bind(hapticFeedback),
    addToCart: hapticFeedback.addToCart.bind(hapticFeedback),
    removeFromCart: hapticFeedback.removeFromCart.bind(hapticFeedback),
    orderSuccess: hapticFeedback.orderSuccess.bind(hapticFeedback),
    paymentSuccess: hapticFeedback.paymentSuccess.bind(hapticFeedback),
  };
};

// HOC for adding haptic feedback to components
export const withHapticFeedback = (WrappedComponent, hapticType = HapticFeedbackType.LIGHT) => {
  return React.forwardRef((props, ref) => {
    const handlePress = React.useCallback(async (event) => {
      await hapticFeedback.trigger(hapticType);
      if (props.onPress) {
        props.onPress(event);
      }
    }, [props.onPress]);

    return React.createElement(WrappedComponent, {
      ...props,
      ref,
      onPress: handlePress,
    });
  });
};

// Initialize from localStorage
hapticFeedback.setEnabled(hapticFeedback.getEnabled());

// Export utilities
export const triggerHaptic = hapticFeedback.trigger.bind(hapticFeedback);
export const setHapticEnabled = hapticFeedback.setEnabled.bind(hapticFeedback);
export const isHapticSupported = () => hapticFeedback.isSupported;

export default hapticFeedback;