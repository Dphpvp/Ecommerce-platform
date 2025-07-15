import React, { useState, useRef, useEffect } from 'react';
import './OptimizedImage.css';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  placeholder = '/images/placeholder.jpg',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // If priority, load immediately
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError(e);
  };

  const imageClasses = [
    'optimized-image',
    className,
    isLoaded ? 'loaded' : 'loading',
    hasError ? 'error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={imgRef} className="optimized-image-container">
      {/* Placeholder shown while loading */}
      {!isLoaded && !hasError && (
        <div className="image-placeholder">
          <div className="placeholder-shimmer" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="image-error">
          <div className="error-icon">📷</div>
          <span>Failed to load image</span>
        </div>
      )}

      {/* Actual image - only render when in view or priority */}
      {(isInView || priority) && (
        <img
          src={src}
          alt={alt}
          className={imageClasses}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

// Specialized components for different use cases
export const ProductImage = ({ src, alt, ...props }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw"
    className="product-image"
    {...props}
  />
);

export const HeroImage = ({ src, alt, ...props }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    priority={true}
    sizes="100vw"
    className="hero-image"
    {...props}
  />
);

export const AvatarImage = ({ src, alt, size = 'medium', ...props }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    className={`avatar-image avatar-${size}`}
    sizes="(max-width: 768px) 80px, 120px"
    {...props}
  />
);

export const ThumbnailImage = ({ src, alt, ...props }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    sizes="150px"
    className="thumbnail-image"
    {...props}
  />
);

export default OptimizedImage;