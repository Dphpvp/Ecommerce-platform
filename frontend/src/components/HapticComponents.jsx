import React, { useState, useRef } from 'react';
import { useHapticFeedback, HapticFeedbackType } from '../utils/hapticFeedback';
import platformDetection from '../utils/platformDetection';

// Enhanced button with haptic feedback
export const HapticButton = ({ 
  children, 
  onClick, 
  onLongPress,
  hapticType = HapticFeedbackType.LIGHT,
  longPressHapticType = HapticFeedbackType.MEDIUM,
  className = '',
  disabled = false,
  variant = 'primary',
  ...props 
}) => {
  const { trigger, buttonPress, buttonLongPress } = useHapticFeedback();
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimer = useRef(null);

  const handlePress = async (e) => {
    if (disabled) return;
    
    await trigger(hapticType);
    if (onClick) onClick(e);
  };

  const handleMouseDown = () => {
    if (disabled || !onLongPress) return;
    
    setIsPressed(true);
    longPressTimer.current = setTimeout(async () => {
      await trigger(longPressHapticType);
      if (onLongPress) onLongPress();
      setIsPressed(false);
    }, 500);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const buttonClass = [
    'haptic-button',
    `btn-${variant}`,
    className,
    isPressed ? 'pressed' : '',
    disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClass}
      onClick={handlePress}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Toggle switch with haptic feedback
export const HapticToggle = ({ 
  checked, 
  onChange, 
  label,
  disabled = false,
  className = '' 
}) => {
  const { switchToggle } = useHapticFeedback();

  const handleToggle = async () => {
    if (disabled) return;
    
    await switchToggle();
    if (onChange) onChange(!checked);
  };

  return (
    <div className={`haptic-toggle ${className}`}>
      {label && <label className="toggle-label">{label}</label>}
      <button
        className={`toggle-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle switch'}
      >
        <span className="toggle-handle" />
      </button>
    </div>
  );
};

// Cart action button with contextual haptic feedback
export const CartActionButton = ({ 
  action, 
  productId, 
  quantity = 1,
  onAction,
  children,
  className = '' 
}) => {
  const { addToCart, removeFromCart, error } = useHapticFeedback();

  const handleAction = async () => {
    try {
      if (action === 'add') {
        await addToCart();
      } else if (action === 'remove') {
        await removeFromCart();
      }
      
      if (onAction) {
        onAction(action, productId, quantity);
      }
    } catch (err) {
      await error();
      console.error('Cart action failed:', err);
    }
  };

  const buttonClass = [
    'cart-action-button',
    `cart-${action}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <HapticButton
      className={buttonClass}
      onClick={handleAction}
      hapticType={action === 'add' ? HapticFeedbackType.SUCCESS : HapticFeedbackType.WARNING}
    >
      {children}
    </HapticButton>
  );
};

// Swipeable card with haptic feedback
export const HapticSwipeCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  onTap,
  className = '' 
}) => {
  const { swipeAction, buttonPress } = useHapticFeedback();
  const [isGesturing, setIsGesturing] = useState(false);

  const handleSwipeLeft = async () => {
    await swipeAction();
    if (onSwipeLeft) onSwipeLeft();
  };

  const handleSwipeRight = async () => {
    await swipeAction();
    if (onSwipeRight) onSwipeRight();
  };

  const handleTap = async () => {
    if (isGesturing) return;
    await buttonPress();
    if (onTap) onTap();
  };

  return (
    <div 
      className={`haptic-swipe-card ${className}`}
      onClick={handleTap}
    >
      {children}
    </div>
  );
};

// Enhanced input with haptic feedback
export const HapticInput = ({ 
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  className = '',
  ...props 
}) => {
  const { keyboardTap } = useHapticFeedback();

  const handleFocus = async (e) => {
    if (platformDetection.isMobile) {
      await keyboardTap();
    }
    if (onFocus) onFocus(e);
  };

  const handleChange = async (e) => {
    if (platformDetection.isMobile) {
      await keyboardTap();
    }
    if (onChange) onChange(e);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`haptic-input ${className}`}
      {...props}
    />
  );
};

// Navigation button with haptic feedback
export const HapticNavButton = ({ 
  direction = 'forward', 
  onClick,
  children,
  className = '' 
}) => {
  const { navigationBack, navigationForward } = useHapticFeedback();

  const handleClick = async (e) => {
    if (direction === 'back') {
      await navigationBack();
    } else {
      await navigationForward();
    }
    
    if (onClick) onClick(e);
  };

  return (
    <HapticButton
      className={`haptic-nav-button nav-${direction} ${className}`}
      onClick={handleClick}
      hapticType={HapticFeedbackType.LIGHT}
    >
      {children}
    </HapticButton>
  );
};

// Modal with haptic feedback
export const HapticModal = ({ 
  isOpen, 
  onClose, 
  children,
  className = '' 
}) => {
  const { modalOpen, modalClose } = useHapticFeedback();
  const [wasOpen, setWasOpen] = useState(false);

  React.useEffect(() => {
    if (isOpen && !wasOpen) {
      modalOpen();
      setWasOpen(true);
    } else if (!isOpen && wasOpen) {
      modalClose();
      setWasOpen(false);
    }
  }, [isOpen, wasOpen, modalOpen, modalClose]);

  if (!isOpen) return null;

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget) {
      await modalClose();
      if (onClose) onClose();
    }
  };

  return (
    <div 
      className={`haptic-modal-backdrop ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="haptic-modal-content">
        <HapticButton
          className="modal-close-button"
          onClick={onClose}
          hapticType={HapticFeedbackType.LIGHT}
        >
          ×
        </HapticButton>
        {children}
      </div>
    </div>
  );
};

// Tab navigation with haptic feedback
export const HapticTabs = ({ 
  tabs, 
  activeTab, 
  onChange,
  className = '' 
}) => {
  const { tabSwitch } = useHapticFeedback();

  const handleTabChange = async (tabId) => {
    if (tabId !== activeTab) {
      await tabSwitch();
      if (onChange) onChange(tabId);
    }
  };

  return (
    <div className={`haptic-tabs ${className}`}>
      {tabs.map((tab) => (
        <HapticButton
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabChange(tab.id)}
          hapticType={HapticFeedbackType.SELECTION}
        >
          {tab.label}
        </HapticButton>
      ))}
    </div>
  );
};

// Floating action button with haptic feedback
export const HapticFAB = ({ 
  icon, 
  onClick, 
  className = '',
  size = 'normal' 
}) => {
  const { buttonPress } = useHapticFeedback();

  const handleClick = async (e) => {
    await buttonPress();
    if (onClick) onClick(e);
  };

  return (
    <HapticButton
      className={`haptic-fab fab-${size} ${className}`}
      onClick={handleClick}
      hapticType={HapticFeedbackType.MEDIUM}
    >
      {icon}
    </HapticButton>
  );
};

// Settings toggle with haptic feedback
export const HapticSettingsItem = ({ 
  label, 
  description,
  checked, 
  onChange,
  className = '' 
}) => {
  return (
    <div className={`haptic-settings-item ${className}`}>
      <div className="settings-info">
        <h4 className="settings-label">{label}</h4>
        {description && <p className="settings-description">{description}</p>}
      </div>
      <HapticToggle
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
};

export default {
  HapticButton,
  HapticToggle,
  CartActionButton,
  HapticSwipeCard,
  HapticInput,
  HapticNavButton,
  HapticModal,
  HapticTabs,
  HapticFAB,
  HapticSettingsItem,
};