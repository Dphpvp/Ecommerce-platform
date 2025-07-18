import React from 'react';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';

export const withSwipeableNavigation = (WrappedComponent) => {
  return (props) => {
    const navigate = useNavigate();

    const handlers = useSwipeable({
      onSwipedLeft: () => navigate(1),
      onSwipedRight: () => navigate(-1),
      preventDefaultTouchmoveEvent: true,
      trackMouse: true
    });

    return (
      <div {...handlers}>
        <WrappedComponent {...props} />
      </div>
    );
  };
};
