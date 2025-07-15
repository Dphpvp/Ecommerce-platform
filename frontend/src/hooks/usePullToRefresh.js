import { useEffect, useRef, useCallback, useState } from 'react';
import { useHapticFeedback } from '../utils/hapticFeedback';
import platformDetection from '../utils/platformDetection';

// Pull to refresh configuration
const PTR_CONFIG = {
  threshold: 60,
  maxDistance: 100,
  resistance: 2.5,
  snapBackDuration: 300,
  refreshDuration: 1000,
  triggerThreshold: 0.8,
};

export const usePullToRefresh = ({
  onRefresh,
  threshold = PTR_CONFIG.threshold,
  maxDistance = PTR_CONFIG.maxDistance,
  resistance = PTR_CONFIG.resistance,
  disabled = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  
  const { pullToRefresh } = useHapticFeedback();
  
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isScrollAtTop = useRef(true);
  const animationFrame = useRef(null);
  const hapticTriggered = useRef(false);

  // Check if container is scrolled to top
  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop } = containerRef.current;
    isScrollAtTop.current = scrollTop <= 0;
  }, []);

  // Calculate pull distance with resistance
  const calculatePullDistance = (deltaY) => {
    if (deltaY <= 0) return 0;
    
    const distance = deltaY / resistance;
    return Math.min(distance, maxDistance);
  };

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (disabled || !isScrollAtTop.current || isRefreshing) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    hapticTriggered.current = false;
    
    // Prevent default scroll behavior when pulling
    if (isScrollAtTop.current) {
      e.preventDefault();
    }
  }, [disabled, isRefreshing]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (disabled || !isScrollAtTop.current || isRefreshing) return;
    
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) {
      e.preventDefault();
      
      const distance = calculatePullDistance(deltaY);
      setPullDistance(distance);
      setIsPulling(distance > 0);
      
      const shouldRefresh = distance >= threshold;
      setCanRefresh(shouldRefresh);
      
      // Trigger haptic feedback when threshold is reached
      if (shouldRefresh && !hapticTriggered.current) {
        pullToRefresh();
        hapticTriggered.current = true;
      } else if (!shouldRefresh) {
        hapticTriggered.current = false;
      }
    }
  }, [disabled, isRefreshing, threshold, pullToRefresh]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isPulling) return;
    
    if (canRefresh && onRefresh) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        // Keep refreshing state for minimum duration for better UX
        setTimeout(() => {
          setIsRefreshing(false);
        }, PTR_CONFIG.refreshDuration);
      }
    }
    
    // Snap back to original position
    setIsPulling(false);
    setCanRefresh(false);
    
    // Animate back to 0
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    const startDistance = pullDistance;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / PTR_CONFIG.snapBackDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentDistance = startDistance * (1 - easeOut);
      setPullDistance(currentDistance);
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setPullDistance(0);
      }
    };
    
    animationFrame.current = requestAnimationFrame(animate);
  }, [disabled, isPulling, canRefresh, onRefresh, pullDistance]);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !platformDetection.isMobile) return;

    // Scroll listener to check position
    container.addEventListener('scroll', checkScrollPosition, { passive: true });
    
    // Touch listeners for pull to refresh
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Initial check
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, checkScrollPosition]);

  // Calculate progress for animations
  const progress = Math.min(pullDistance / threshold, 1);
  const isThresholdReached = progress >= PTR_CONFIG.triggerThreshold;

  return {
    containerRef,
    isRefreshing,
    isPulling,
    canRefresh,
    pullDistance,
    progress,
    isThresholdReached,
  };
};

export default usePullToRefresh;