import React from 'react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
// Styles included in main theme

// Pull to refresh indicator component
const RefreshIndicator = ({ 
  isRefreshing, 
  progress, 
  isThresholdReached,
  pullDistance 
}) => {
  const rotation = progress * 180; // Rotate up to 180 degrees
  const scale = Math.min(progress * 1.2, 1);
  const opacity = Math.min(progress * 2, 1);

  return (
    <div 
      className="refresh-indicator"
      style={{
        transform: `translateY(${pullDistance * 0.5}px) scale(${scale})`,
        opacity,
      }}
    >
      <div 
        className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}
        style={{
          transform: `rotate(${isRefreshing ? 0 : rotation}deg)`,
        }}
      >
        {isRefreshing ? (
          <svg width="24" height="24" viewBox="0 0 24 24" className="spinner">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="60"
              strokeDashoffset="60"
            />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        )}
      </div>
      <div className="refresh-text">
        {isRefreshing ? 'Refreshing...' : 
         isThresholdReached ? 'Release to refresh' : 'Pull to refresh'}
      </div>
    </div>
  );
};

// Main pull to refresh component
export const PullToRefresh = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 60,
  maxDistance = 100,
  className = '',
  indicatorProps = {},
}) => {
  const {
    containerRef,
    isRefreshing,
    isPulling,
    canRefresh,
    pullDistance,
    progress,
    isThresholdReached,
  } = usePullToRefresh({
    onRefresh,
    threshold,
    maxDistance,
    disabled,
  });

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh-container ${className} ${isPulling ? 'pulling' : ''}`}
      style={{
        transform: isPulling ? `translateY(${pullDistance * 0.3}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Refresh indicator */}
      {(isPulling || isRefreshing) && (
        <RefreshIndicator
          isRefreshing={isRefreshing}
          progress={progress}
          isThresholdReached={isThresholdReached}
          pullDistance={pullDistance}
          {...indicatorProps}
        />
      )}
      
      {/* Content */}
      <div className="pull-to-refresh-content">
        {children}
      </div>
    </div>
  );
};

// Enhanced list component with pull to refresh
export const RefreshableList = ({
  items = [],
  renderItem,
  onRefresh,
  loading = false,
  emptyMessage = 'No items found',
  className = '',
  ...pullToRefreshProps
}) => {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      className={`refreshable-list ${className}`}
      {...pullToRefreshProps}
    >
      {loading && !items.length ? (
        <div className="list-loading">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      ) : items.length > 0 ? (
        <div className="list-items">
          {items.map((item, index) => (
            <div key={item.id || index} className="list-item">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div className="list-empty">
          <span>{emptyMessage}</span>
        </div>
      )}
    </PullToRefresh>
  );
};

// Product list with pull to refresh
export const RefreshableProductList = ({
  products = [],
  onRefresh,
  onProductClick,
  loading = false,
  className = '',
}) => {
  const renderProduct = (product) => (
    <div 
      className="product-card refreshable"
      onClick={() => onProductClick?.(product)}
    >
      <div className="product-image">
        <img 
          src={product.image || '/placeholder-product.jpg'} 
          alt={product.name}
          loading="lazy"
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">${product.price}</p>
        {product.discount && (
          <span className="product-discount">-{product.discount}%</span>
        )}
      </div>
    </div>
  );

  return (
    <RefreshableList
      items={products}
      renderItem={renderProduct}
      onRefresh={onRefresh}
      loading={loading}
      emptyMessage="No products available"
      className={`refreshable-product-list ${className}`}
    />
  );
};

// Orders list with pull to refresh
export const RefreshableOrderList = ({
  orders = [],
  onRefresh,
  onOrderClick,
  loading = false,
  className = '',
}) => {
  const renderOrder = (order) => (
    <div 
      className="order-card refreshable"
      onClick={() => onOrderClick?.(order)}
    >
      <div className="order-header">
        <span className="order-id">#{order.id}</span>
        <span className={`order-status status-${order.status}`}>
          {order.status}
        </span>
      </div>
      <div className="order-details">
        <p className="order-date">{new Date(order.createdAt).toLocaleDateString()}</p>
        <p className="order-total">${order.total}</p>
      </div>
    </div>
  );

  return (
    <RefreshableList
      items={orders}
      renderItem={renderOrder}
      onRefresh={onRefresh}
      loading={loading}
      emptyMessage="No orders found"
      className={`refreshable-order-list ${className}`}
    />
  );
};

// Page wrapper with pull to refresh
export const RefreshablePage = ({
  children,
  onRefresh,
  title,
  subtitle,
  className = '',
  ...pullToRefreshProps
}) => {
  return (
    <div className={`refreshable-page ${className}`}>
      {(title || subtitle) && (
        <div className="page-header">
          {title && <h1 className="page-title">{title}</h1>}
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <PullToRefresh
        onRefresh={onRefresh}
        className="page-content"
        {...pullToRefreshProps}
      >
        {children}
      </PullToRefresh>
    </div>
  );
};

export default {
  PullToRefresh,
  RefreshableList,
  RefreshableProductList,
  RefreshableOrderList,
  RefreshablePage,
};