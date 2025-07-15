import React, { useState, useEffect, useRef } from 'react';
import { useHapticFeedback } from '../utils/hapticFeedback';
import { useSwipe, useLongPress } from '../hooks/useGestures';
import platformDetection from '../utils/platformDetection';
import './MobileUIPatterns.css';

// Bottom Sheet Component
export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [200, 400, '90%'],
  initialSnap = 1,
  showHandle = true,
  dismissible = true,
  className = ''
}) => {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const { modalOpen, modalClose, swipeAction } = useHapticFeedback();
  const sheetRef = useRef(null);
  const startY = useRef(0);

  // Handle haptic feedback
  useEffect(() => {
    if (isOpen) {
      modalOpen();
    } else {
      modalClose();
    }
  }, [isOpen, modalOpen, modalClose]);

  // Prevent body scroll when open
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

  const getSnapValue = (index) => {
    const snap = snapPoints[index];
    if (typeof snap === 'string' && snap.endsWith('%')) {
      return (window.innerHeight * parseInt(snap)) / 100;
    }
    return snap;
  };

  const handleTouchStart = (e) => {
    if (!platformDetection.isMobile) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // Only allow dragging down
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = 100;
    
    if (dragOffset > threshold) {
      if (currentSnap < snapPoints.length - 1) {
        // Snap to next lower position
        await swipeAction();
        setCurrentSnap(currentSnap + 1);
      } else if (dismissible) {
        // Close the bottom sheet
        await modalClose();
        onClose();
      }
    }
    
    setDragOffset(0);
  };

  const handleSnapChange = async (index) => {
    await swipeAction();
    setCurrentSnap(index);
  };

  const handleBackdropClick = async () => {
    if (dismissible) {
      await modalClose();
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentHeight = getSnapValue(currentSnap);
  const transform = isDragging 
    ? `translateY(${dragOffset}px)` 
    : `translateY(calc(100vh - ${currentHeight}px))`;

  return (
    <div className="bottom-sheet-overlay" onClick={handleBackdropClick}>
      <div
        ref={sheetRef}
        className={`bottom-sheet ${className}`}
        style={{
          transform,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showHandle && (
          <div className="bottom-sheet-handle">
            <div className="handle-bar" />
          </div>
        )}
        
        <div className="bottom-sheet-content safe-area-bottom">
          {title && (
            <div className="bottom-sheet-header">
              <h3 className="sheet-title">{title}</h3>
              {dismissible && (
                <button 
                  className="close-button"
                  onClick={onClose}
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>
          )}
          
          <div className="sheet-body">
            {children}
          </div>
        </div>
        
        {/* Snap indicators */}
        {snapPoints.length > 1 && (
          <div className="snap-indicators">
            {snapPoints.map((_, index) => (
              <button
                key={index}
                className={`snap-indicator ${index === currentSnap ? 'active' : ''}`}
                onClick={() => handleSnapChange(index)}
                aria-label={`Snap to position ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Action Sheet Component
export const ActionSheet = ({
  isOpen,
  onClose,
  actions = [],
  title,
  message,
  destructiveIndex,
  cancelIndex,
  className = ''
}) => {
  const { buttonPress, modalClose } = useHapticFeedback();

  const handleActionClick = async (action, index) => {
    await buttonPress();
    
    if (action.handler) {
      action.handler();
    }
    
    // Auto-close unless it's a custom action that prevents it
    if (action.autoClose !== false) {
      onClose();
    }
  };

  const handleClose = async () => {
    await modalClose();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      snapPoints={['auto']}
      showHandle={false}
      className={`action-sheet ${className}`}
    >
      <div className="action-sheet-content">
        {(title || message) && (
          <div className="action-sheet-header">
            {title && <h3 className="action-title">{title}</h3>}
            {message && <p className="action-message">{message}</p>}
          </div>
        )}
        
        <div className="action-list">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`action-item ${
                index === destructiveIndex ? 'destructive' : ''
              } ${index === cancelIndex ? 'cancel' : ''}`}
              onClick={() => handleActionClick(action, index)}
              disabled={action.disabled}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-text">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};

// Swipe Actions Component
export const SwipeActions = ({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 75,
  className = ''
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [activeAction, setActiveAction] = useState(null);
  const { swipeAction } = useHapticFeedback();
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    if (!platformDetection.isMobile) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;
    
    setSwipeOffset(deltaX);
    
    // Determine active action
    if (Math.abs(deltaX) > threshold) {
      const actions = deltaX > 0 ? leftActions : rightActions;
      const actionIndex = Math.min(
        Math.floor(Math.abs(deltaX) / threshold) - 1,
        actions.length - 1
      );
      setActiveAction(actions[actionIndex]);
    } else {
      setActiveAction(null);
    }
  };

  const handleTouchEnd = async () => {
    isDragging.current = false;
    
    if (activeAction && Math.abs(swipeOffset) > threshold) {
      await swipeAction();
      if (activeAction.handler) {
        activeAction.handler();
      }
    }
    
    // Reset
    setSwipeOffset(0);
    setActiveAction(null);
  };

  return (
    <div className={`swipe-actions-container ${className}`}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="swipe-actions left">
          {leftActions.map((action, index) => (
            <div
              key={index}
              className={`swipe-action ${action.style || ''}`}
              style={{
                transform: `translateX(${Math.max(0, swipeOffset - index * 75)}px)`,
              }}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-label">{action.label}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Content */}
      <div
        className="swipe-content"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      
      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="swipe-actions right">
          {rightActions.map((action, index) => (
            <div
              key={index}
              className={`swipe-action ${action.style || ''}`}
              style={{
                transform: `translateX(${Math.min(0, swipeOffset + index * 75)}px)`,
              }}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-label">{action.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile Card with enhanced interactions
export const MobileCard = ({
  children,
  onTap,
  onLongPress,
  swipeable = false,
  leftActions = [],
  rightActions = [],
  elevation = 1,
  className = ''
}) => {
  const { buttonPress, buttonLongPress } = useHapticFeedback();

  const { elementRef: longPressRef } = useLongPress({
    onLongPress: async () => {
      await buttonLongPress();
      if (onLongPress) onLongPress();
    },
    onPress: async () => {
      await buttonPress();
      if (onTap) onTap();
    },
  });

  const cardContent = (
    <div 
      ref={longPressRef}
      className={`mobile-card elevation-${elevation} ${className}`}
    >
      {children}
    </div>
  );

  if (swipeable && (leftActions.length > 0 || rightActions.length > 0)) {
    return (
      <SwipeActions
        leftActions={leftActions}
        rightActions={rightActions}
      >
        {cardContent}
      </SwipeActions>
    );
  }

  return cardContent;
};

// Segmented Control
export const SegmentedControl = ({
  segments = [],
  selectedIndex = 0,
  onChange,
  className = ''
}) => {
  const { tabSwitch } = useHapticFeedback();

  const handleSegmentChange = async (index) => {
    if (index !== selectedIndex) {
      await tabSwitch();
      if (onChange) onChange(index);
    }
  };

  return (
    <div className={`segmented-control ${className}`}>
      <div className="segments-container">
        {segments.map((segment, index) => (
          <button
            key={index}
            className={`segment ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => handleSegmentChange(index)}
            disabled={segment.disabled}
          >
            {segment.icon && <span className="segment-icon">{segment.icon}</span>}
            <span className="segment-label">{segment.label}</span>
          </button>
        ))}
        
        {/* Selection indicator */}
        <div
          className="selection-indicator"
          style={{
            transform: `translateX(${selectedIndex * 100}%)`,
            width: `${100 / segments.length}%`,
          }}
        />
      </div>
    </div>
  );
};

// Mobile Toast with gestures
export const MobileToast = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  swipeToDismiss = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { swipeAction } = useHapticFeedback();

  // Auto dismiss
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const swipeRef = useSwipe({
    onSwipeUp: async () => {
      if (swipeToDismiss) {
        await swipeAction();
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }
    },
    disabled: !swipeToDismiss,
  });

  if (!isVisible) return null;

  return (
    <div
      ref={swipeRef}
      className={`mobile-toast toast-${type} safe-area-top ${className}`}
      style={{
        transform: `translateY(${swipeOffset}px)`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        <button
          className="toast-dismiss"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default {
  BottomSheet,
  ActionSheet,
  SwipeActions,
  MobileCard,
  SegmentedControl,
  MobileToast,
};