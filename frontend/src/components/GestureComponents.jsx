import React, { useState, useRef, useEffect } from 'react';
import { useSwipe, usePinchZoom, useLongPress } from '../hooks/useGestures';
import platformDetection from '../utils/platformDetection';
// Styles included in main theme

// Swipeable carousel component
export const SwipeableCarousel = ({ 
  children, 
  onSwipeChange,
  currentIndex = 0,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef(null);

  const totalSlides = React.Children.count(children);

  const goToSlide = (index) => {
    if (isTransitioning) return;
    
    const newIndex = Math.max(0, Math.min(totalSlides - 1, index));
    setIsTransitioning(true);
    setActiveIndex(newIndex);
    
    if (onSwipeChange) {
      onSwipeChange(newIndex);
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const nextSlide = () => goToSlide(activeIndex + 1);
  const prevSlide = () => goToSlide(activeIndex - 1);

  const swipeRef = useSwipe({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    disabled: !platformDetection.isMobile,
  });

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % totalSlides);
      }, autoPlayInterval);
    }
    
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, totalSlides]);

  // Pause auto-play on user interaction
  const handleInteraction = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  return (
    <div 
      ref={swipeRef}
      className={`swipeable-carousel ${className}`}
      onTouchStart={handleInteraction}
    >
      <div 
        className="carousel-track"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="carousel-slide">
            {child}
          </div>
        ))}
      </div>
      
      {showIndicators && totalSlides > 1 && (
        <div className="carousel-indicators">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              className={`indicator ${index === activeIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {totalSlides > 1 && (
        <>
          <button
            className="carousel-nav prev"
            onClick={prevSlide}
            disabled={activeIndex === 0}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className="carousel-nav next"
            onClick={nextSlide}
            disabled={activeIndex === totalSlides - 1}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

// Zoomable image component
export const ZoomableImage = ({ 
  src, 
  alt, 
  maxScale = 3,
  minScale = 1,
  className = '',
  onZoomChange 
}) => {
  const [transformOrigin, setTransformOrigin] = useState('center center');
  
  const { elementRef, scale, isGesturing, setScale } = usePinchZoom({
    maxScale,
    minScale,
    onPinchStart: ({ center }) => {
      setTransformOrigin(`${center.x}px ${center.y}px`);
    },
    onPinchMove: ({ scale: newScale }) => {
      if (onZoomChange) {
        onZoomChange(newScale);
      }
    },
    onPinchEnd: ({ scale: finalScale }) => {
      // Snap to min scale if close
      if (finalScale < minScale + 0.1) {
        setScale(minScale);
      }
    },
    disabled: !platformDetection.isMobile,
  });

  // Double tap to zoom
  const { elementRef: doubleTapRef } = useLongPress({
    onPress: () => {
      if (scale > minScale) {
        setScale(minScale);
      } else {
        setScale(maxScale / 2);
      }
    },
    threshold: 200,
  });

  useEffect(() => {
    if (elementRef.current && doubleTapRef.current) {
      doubleTapRef.current = elementRef.current;
    }
  }, [elementRef, doubleTapRef]);

  return (
    <div className={`zoomable-container ${className}`}>
      <img
        ref={elementRef}
        src={src}
        alt={alt}
        className={`zoomable-image ${isGesturing ? 'gesturing' : ''}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin,
          transition: isGesturing ? 'none' : 'transform 0.3s ease-out',
        }}
        draggable={false}
      />
      
      {scale > minScale && (
        <button
          className="zoom-reset"
          onClick={() => setScale(minScale)}
          aria-label="Reset zoom"
        >
          ↻
        </button>
      )}
      
      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={() => setScale(Math.max(minScale, scale - 0.5))}
          disabled={scale <= minScale}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button
          className="zoom-btn"
          onClick={() => setScale(Math.min(maxScale, scale + 0.5))}
          disabled={scale >= maxScale}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
};

// Swipe-to-delete list item
export const SwipeableListItem = ({ 
  children, 
  onDelete, 
  onEdit,
  deleteThreshold = 100,
  editThreshold = 100,
  className = '' 
}) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [actionTriggered, setActionTriggered] = useState(null);

  const handleSwipeMove = (deltaX) => {
    setSwipeDistance(deltaX);
    
    if (Math.abs(deltaX) > deleteThreshold) {
      setActionTriggered(deltaX > 0 ? 'edit' : 'delete');
    } else {
      setActionTriggered(null);
    }
  };

  const handleSwipeEnd = () => {
    if (actionTriggered === 'delete' && onDelete) {
      onDelete();
    } else if (actionTriggered === 'edit' && onEdit) {
      onEdit();
    } else if (Math.abs(swipeDistance) > 50) {
      setIsRevealed(true);
    } else {
      setSwipeDistance(0);
      setIsRevealed(false);
    }
    setActionTriggered(null);
  };

  const swipeRef = useSwipe({
    onSwipeLeft: () => handleSwipeMove(-deleteThreshold),
    onSwipeRight: () => handleSwipeMove(editThreshold),
    disabled: !platformDetection.isMobile,
  });

  const resetSwipe = () => {
    setSwipeDistance(0);
    setIsRevealed(false);
    setActionTriggered(null);
  };

  return (
    <div className={`swipeable-list-item ${className}`} ref={swipeRef}>
      <div
        className="item-content"
        style={{
          transform: `translateX(${swipeDistance}px)`,
          transition: actionTriggered ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
      
      {/* Left action (Edit) */}
      <div className="swipe-action left">
        <button
          className="action-btn edit"
          onClick={onEdit}
          aria-label="Edit item"
        >
          ✏️ Edit
        </button>
      </div>
      
      {/* Right action (Delete) */}
      <div className="swipe-action right">
        <button
          className="action-btn delete"
          onClick={onDelete}
          aria-label="Delete item"
        >
          🗑️ Delete
        </button>
      </div>
      
      {isRevealed && (
        <button
          className="close-actions"
          onClick={resetSwipe}
          aria-label="Close actions"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Product gallery with gestures
export const ProductGallery = ({ images, productName }) => {
  const [currentImage, setCurrentImage] = useState(0);

  if (!images || images.length === 0) {
    return <div className="product-gallery-empty">No images available</div>;
  }

  return (
    <div className="product-gallery">
      <SwipeableCarousel
        currentIndex={currentImage}
        onSwipeChange={setCurrentImage}
        showIndicators={images.length > 1}
        className="gallery-carousel"
      >
        {images.map((image, index) => (
          <ZoomableImage
            key={index}
            src={image.url || image}
            alt={`${productName} - Image ${index + 1}`}
            className="gallery-image"
          />
        ))}
      </SwipeableCarousel>
      
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              className={`thumbnail ${index === currentImage ? 'active' : ''}`}
              onClick={() => setCurrentImage(index)}
            >
              <img 
                src={image.thumbnail || image.url || image} 
                alt={`Thumbnail ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Navigation with swipe back gesture
export const SwipeableNavigation = ({ children, onSwipeBack, canGoBack = false }) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  const handleSwipeRight = ({ deltaX, velocity }) => {
    if (canGoBack && deltaX > 100 && velocity > 0.3) {
      onSwipeBack();
    }
  };

  const swipeRef = useSwipe({
    onSwipeRight: handleSwipeRight,
    disabled: !platformDetection.isMobile || !canGoBack,
  });

  return (
    <div ref={swipeRef} className="swipeable-navigation">
      {canGoBack && swipeProgress > 0 && (
        <div 
          className="swipe-back-indicator"
          style={{ opacity: Math.min(swipeProgress / 100, 1) }}
        >
          ← Swipe to go back
        </div>
      )}
      {children}
    </div>
  );
};

export default {
  SwipeableCarousel,
  ZoomableImage,
  SwipeableListItem,
  ProductGallery,
  SwipeableNavigation,
};