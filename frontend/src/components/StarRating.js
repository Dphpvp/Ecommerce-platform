import React, { useState } from 'react';

const StarRating = ({ rating = 0, maxRating = 5, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (ratingValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(ratingValue);
    }
  };

  const handleMouseEnter = (ratingValue) => {
    if (!readonly) {
      setHoverRating(ratingValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="star-rating">
      {[...Array(maxRating)].map((_, index) => {
        const ratingValue = index + 1;
        const isFilled = (hoverRating || rating) >= ratingValue;
        
        return (
          <button
            key={index}
            type="button"
            className={`star ${isFilled ? 'filled' : ''} ${readonly ? 'readonly' : 'interactive'}`}
            onClick={() => handleClick(ratingValue)}
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isFilled ? "#f59e0b" : "none"}
              stroke="#f59e0b"
              strokeWidth="2"
            >
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;