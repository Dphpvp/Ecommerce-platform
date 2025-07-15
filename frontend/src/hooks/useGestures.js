import { useEffect, useRef, useCallback, useState } from 'react';
import platformDetection from '../utils/platformDetection';

// Gesture configuration constants
const GESTURE_CONFIG = {
  swipe: {
    threshold: 50,
    velocity: 0.3,
    timeThreshold: 300,
  },
  pinch: {
    threshold: 10,
    maxScale: 3,
    minScale: 0.5,
  },
  tap: {
    threshold: 10,
    timeThreshold: 200,
  },
  longPress: {
    threshold: 10,
    timeThreshold: 500,
  },
};

// Touch point utility functions
const getTouchPoint = (touch) => ({
  x: touch.clientX,
  y: touch.clientY,
  id: touch.identifier,
});

const getDistance = (point1, point2) => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getCenter = (point1, point2) => ({
  x: (point1.x + point2.x) / 2,
  y: (point1.y + point2.y) / 2,
});

const getAngle = (point1, point2) => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
};

// Swipe gesture hook
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = GESTURE_CONFIG.swipe.threshold,
  velocity = GESTURE_CONFIG.swipe.velocity,
  disabled = false,
}) => {
  const startPoint = useRef(null);
  const startTime = useRef(null);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    startPoint.current = getTouchPoint(touch);
    startTime.current = Date.now();
  }, [disabled]);

  const handleTouchEnd = useCallback((e) => {
    if (disabled || !startPoint.current || !startTime.current) return;
    
    const touch = e.changedTouches[0];
    const endPoint = getTouchPoint(touch);
    const endTime = Date.now();
    
    const deltaX = endPoint.x - startPoint.current.x;
    const deltaY = endPoint.y - startPoint.current.y;
    const deltaTime = endTime - startTime.current;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const swipeVelocity = distance / deltaTime;
    
    // Check if swipe meets criteria
    if (distance >= threshold && swipeVelocity >= velocity && deltaTime <= GESTURE_CONFIG.swipe.timeThreshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight({ deltaX, deltaY, velocity: swipeVelocity, duration: deltaTime });
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft({ deltaX, deltaY, velocity: swipeVelocity, duration: deltaTime });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown({ deltaX, deltaY, velocity: swipeVelocity, duration: deltaTime });
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp({ deltaX, deltaY, velocity: swipeVelocity, duration: deltaTime });
        }
      }
    }
    
    startPoint.current = null;
    startTime.current = null;
  }, [disabled, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocity]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !platformDetection.isMobile) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return elementRef;
};

// Pinch-to-zoom gesture hook
export const usePinchZoom = ({
  onPinchStart,
  onPinchMove,
  onPinchEnd,
  minScale = GESTURE_CONFIG.pinch.minScale,
  maxScale = GESTURE_CONFIG.pinch.maxScale,
  disabled = false,
}) => {
  const [isGesturing, setIsGesturing] = useState(false);
  const [scale, setScale] = useState(1);
  const gestureState = useRef({
    initialDistance: null,
    initialScale: 1,
    center: null,
  });
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled || e.touches.length !== 2) return;
    
    e.preventDefault();
    
    const touch1 = getTouchPoint(e.touches[0]);
    const touch2 = getTouchPoint(e.touches[1]);
    
    gestureState.current.initialDistance = getDistance(touch1, touch2);
    gestureState.current.initialScale = scale;
    gestureState.current.center = getCenter(touch1, touch2);
    
    setIsGesturing(true);
    
    if (onPinchStart) {
      onPinchStart({
        scale,
        center: gestureState.current.center,
      });
    }
  }, [disabled, scale, onPinchStart]);

  const handleTouchMove = useCallback((e) => {
    if (disabled || !isGesturing || e.touches.length !== 2) return;
    
    e.preventDefault();
    
    const touch1 = getTouchPoint(e.touches[0]);
    const touch2 = getTouchPoint(e.touches[1]);
    
    const currentDistance = getDistance(touch1, touch2);
    const currentCenter = getCenter(touch1, touch2);
    
    if (gestureState.current.initialDistance) {
      const scaleRatio = currentDistance / gestureState.current.initialDistance;
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, gestureState.current.initialScale * scaleRatio)
      );
      
      setScale(newScale);
      
      if (onPinchMove) {
        onPinchMove({
          scale: newScale,
          center: currentCenter,
          delta: scaleRatio,
        });
      }
    }
  }, [disabled, isGesturing, maxScale, minScale, onPinchMove]);

  const handleTouchEnd = useCallback((e) => {
    if (disabled || !isGesturing) return;
    
    setIsGesturing(false);
    gestureState.current.initialDistance = null;
    
    if (onPinchEnd) {
      onPinchEnd({ scale });
    }
  }, [disabled, isGesturing, scale, onPinchEnd]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !platformDetection.isMobile) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { elementRef, scale, isGesturing, setScale };
};

// Long press gesture hook
export const useLongPress = ({
  onLongPress,
  onPress,
  threshold = GESTURE_CONFIG.longPress.timeThreshold,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef(null);
  const startPoint = useRef(null);
  const elementRef = useRef(null);

  const handleStart = useCallback((e) => {
    if (disabled) return;
    
    const point = e.touches ? getTouchPoint(e.touches[0]) : { x: e.clientX, y: e.clientY };
    startPoint.current = point;
    setIsPressed(true);
    
    timeoutRef.current = setTimeout(() => {
      if (onLongPress && startPoint.current) {
        onLongPress({ point: startPoint.current });
      }
    }, threshold);
  }, [disabled, onLongPress, threshold]);

  const handleEnd = useCallback((e) => {
    if (disabled || !startPoint.current) return;
    
    const endPoint = e.changedTouches ? 
      getTouchPoint(e.changedTouches[0]) : 
      { x: e.clientX, y: e.clientY };
    
    const distance = getDistance(startPoint.current, endPoint);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsPressed(false);
    
    // Regular press if not moved much and timeout didn't fire
    if (distance < GESTURE_CONFIG.tap.threshold && onPress) {
      onPress({ point: endPoint });
    }
    
    startPoint.current = null;
  }, [disabled, onPress]);

  const handleMove = useCallback((e) => {
    if (disabled || !startPoint.current) return;
    
    const currentPoint = e.touches ? 
      getTouchPoint(e.touches[0]) : 
      { x: e.clientX, y: e.clientY };
    
    const distance = getDistance(startPoint.current, currentPoint);
    
    // Cancel long press if moved too much
    if (distance > GESTURE_CONFIG.longPress.threshold && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [disabled]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart, { passive: false });
    element.addEventListener('touchend', handleEnd, { passive: false });
    element.addEventListener('touchmove', handleMove, { passive: false });
    
    // Mouse events for desktop testing
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('mousemove', handleMove);

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('mousemove', handleMove);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleStart, handleEnd, handleMove]);

  return { elementRef, isPressed };
};

// Combined gesture hook for multiple gestures on one element
export const useGestures = (config) => {
  const swipeRef = useSwipe(config.swipe || {});
  const { elementRef: pinchRef, ...pinchState } = usePinchZoom(config.pinch || {});
  const { elementRef: longPressRef, ...longPressState } = useLongPress(config.longPress || {});
  
  const combinedRef = useRef(null);
  
  useEffect(() => {
    if (combinedRef.current) {
      // Set the same element for all gesture refs
      swipeRef.current = combinedRef.current;
      pinchRef.current = combinedRef.current;
      longPressRef.current = combinedRef.current;
    }
  }, [swipeRef, pinchRef, longPressRef]);
  
  return {
    gestureRef: combinedRef,
    pinch: pinchState,
    longPress: longPressState,
  };
};

export default {
  useSwipe,
  usePinchZoom,
  useLongPress,
  useGestures,
};