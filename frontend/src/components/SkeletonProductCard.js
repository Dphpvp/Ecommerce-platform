import React from 'react';

const SkeletonProductCard = () => {
  return (
    <div className="modern-product-card">
      <div className="product-image-container skeleton" />
      <div className="product-info">
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
    </div>
  );
};

export default SkeletonProductCard;
