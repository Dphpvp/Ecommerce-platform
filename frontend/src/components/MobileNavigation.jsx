import React, { useState, useEffect } from 'react';
import { useHapticFeedback } from '../utils/hapticFeedback';
import { useSwipe } from '../hooks/useGestures';
import platformDetection from '../utils/platformDetection';
import './MobileNavigation.css';

// Bottom navigation component
export const BottomNavigation = ({ 
  items = [], 
  activeItem, 
  onItemChange,
  className = '' 
}) => {
  const { tabSwitch } = useHapticFeedback();

  const handleItemClick = async (item) => {
    if (item.id !== activeItem) {
      await tabSwitch();
      if (onItemChange) onItemChange(item.id);
    }
  };

  return (
    <nav className={`bottom-navigation safe-area-bottom ${className}`}>
      <div className="bottom-nav-container">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => handleItemClick(item)}
            aria-label={item.label}
          >
            <div className="nav-icon">
              {typeof item.icon === 'string' ? (
                <span className="icon-text">{item.icon}</span>
              ) : (
                item.icon
              )}
            </div>
            <span className="nav-label">{item.label}</span>
            {item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Tab bar component
export const TabBar = ({ 
  tabs = [], 
  activeTab, 
  onTabChange,
  scrollable = false,
  className = '' 
}) => {
  const { tabSwitch } = useHapticFeedback();

  const handleTabClick = async (tabId) => {
    if (tabId !== activeTab) {
      await tabSwitch();
      if (onTabChange) onTabChange(tabId);
    }
  };

  return (
    <div className={`tab-bar ${scrollable ? 'scrollable' : ''} ${className}`}>
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-text">{tab.label}</span>
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className="tab-indicator" />
    </div>
  );
};

// Mobile header with gestures
export const MobileHeader = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  onBack,
  showBackButton = false,
  transparent = false,
  className = ''
}) => {
  const { navigationBack } = useHapticFeedback();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle swipe to go back
  const swipeRef = useSwipe({
    onSwipeRight: async () => {
      if (showBackButton && onBack) {
        await navigationBack();
        onBack();
      }
    },
    disabled: !platformDetection.isMobile || !showBackButton,
  });

  // Listen for scroll to add blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackClick = async () => {
    await navigationBack();
    if (onBack) onBack();
  };

  const headerClass = [
    'mobile-header',
    'safe-area-top',
    transparent ? 'transparent' : '',
    isScrolled ? 'scrolled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <header ref={swipeRef} className={headerClass}>
      <div className="header-content">
        <div className="header-left">
          {showBackButton && (
            <button 
              className="back-button"
              onClick={handleBackClick}
              aria-label="Go back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
          )}
          {leftAction}
        </div>
        
        <div className="header-center">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        
        <div className="header-right">
          {rightAction}
        </div>
      </div>
      
      {showBackButton && (
        <div className="swipe-hint">
          <span>← Swipe to go back</span>
        </div>
      )}
    </header>
  );
};

// Drawer component
export const MobileDrawer = ({
  isOpen,
  onClose,
  position = 'left',
  children,
  className = ''
}) => {
  const { modalOpen, modalClose } = useHapticFeedback();
  const [wasOpen, setWasOpen] = useState(false);

  // Handle haptic feedback
  useEffect(() => {
    if (isOpen && !wasOpen) {
      modalOpen();
      setWasOpen(true);
    } else if (!isOpen && wasOpen) {
      modalClose();
      setWasOpen(false);
    }
  }, [isOpen, wasOpen, modalOpen, modalClose]);

  // Handle swipe to close
  const swipeRef = useSwipe({
    onSwipeLeft: position === 'left' ? onClose : undefined,
    onSwipeRight: position === 'right' ? onClose : undefined,
    disabled: !platformDetection.isMobile,
  });

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const drawerClass = [
    'mobile-drawer',
    `drawer-${position}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div 
        ref={swipeRef}
        className={drawerClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-content safe-area-all">
          {children}
        </div>
      </div>
    </div>
  );
};

// Floating action button group
export const FABGroup = ({
  items = [],
  mainAction,
  expanded = false,
  onToggle,
  className = ''
}) => {
  const { buttonPress } = useHapticFeedback();

  const handleMainClick = async () => {
    await buttonPress();
    if (onToggle) onToggle();
  };

  const handleItemClick = async (item) => {
    await buttonPress();
    if (item.onClick) item.onClick();
    if (onToggle) onToggle(); // Close the group
  };

  return (
    <div className={`fab-group ${expanded ? 'expanded' : ''} ${className}`}>
      {/* Sub actions */}
      {expanded && (
        <div className="fab-items">
          {items.map((item, index) => (
            <button
              key={item.id || index}
              className="fab-item"
              onClick={() => handleItemClick(item)}
              aria-label={item.label}
              style={{
                transitionDelay: `${index * 50}ms`
              }}
            >
              <span className="fab-icon">{item.icon}</span>
              <span className="fab-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Main FAB */}
      <button
        className={`fab-main ${expanded ? 'rotated' : ''}`}
        onClick={handleMainClick}
        aria-label={mainAction?.label || 'Actions'}
      >
        <span className="fab-icon">
          {expanded ? '×' : mainAction?.icon || '+'}
        </span>
      </button>
    </div>
  );
};

// Navigation breadcrumbs for mobile
export const MobileBreadcrumbs = ({
  items = [],
  onItemClick,
  className = ''
}) => {
  const { buttonPress } = useHapticFeedback();

  const handleItemClick = async (item, index) => {
    await buttonPress();
    if (onItemClick) onItemClick(item, index);
  };

  if (items.length <= 1) return null;

  return (
    <nav className={`mobile-breadcrumbs ${className}`}>
      <div className="breadcrumb-container">
        {items.map((item, index) => (
          <React.Fragment key={item.id || index}>
            <button
              className={`breadcrumb-item ${index === items.length - 1 ? 'current' : ''}`}
              onClick={() => handleItemClick(item, index)}
              disabled={index === items.length - 1}
            >
              {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
              <span className="breadcrumb-text">{item.label}</span>
            </button>
            
            {index < items.length - 1 && (
              <span className="breadcrumb-separator">›</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

// Search bar with mobile optimizations
export const MobileSearchBar = ({
  value = '',
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  showCancelButton = false,
  onCancel,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { keyboardTap } = useHapticFeedback();

  const handleFocus = async (e) => {
    await keyboardTap();
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleCancel = async () => {
    await keyboardTap();
    if (onCancel) onCancel();
    setIsFocused(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <div className={`mobile-search-bar ${isFocused ? 'focused' : ''} ${className}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          
          <input
            type="search"
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          
          {value && (
            <button
              type="button"
              className="clear-button"
              onClick={() => onChange({ target: { value: '' } })}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        
        {showCancelButton && isFocused && (
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};

export default {
  BottomNavigation,
  TabBar,
  MobileHeader,
  MobileDrawer,
  FABGroup,
  MobileBreadcrumbs,
  MobileSearchBar,
};