import React, { useState, useEffect } from 'react';
import { csrfManager, sanitizeInput, validateInput } from '../utils/csrf';
import { useToastContext } from './toast';

const SecureForm = ({ 
  onSubmit, 
  children, 
  validate = true, 
  className = "",
  requireAuth = false,
  ...props 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [csrfToken, setCsrfToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const { showToast } = useToastContext();

  useEffect(() => {
    const getCsrfToken = async () => {
      setTokenLoading(true);
      try {
        const token = await csrfManager.getToken();
        setCsrfToken(token);
        if (!token) {
          console.warn('⚠️ CSRF token not available');
        }
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
        showToast('Security token failed to load. Please refresh the page.', 'error');
      } finally {
        setTokenLoading(false);
      }
    };
    getCsrfToken();
  }, [showToast]);

  const validateField = (key, value) => {
    const errors = {};
    
    if (key.includes('email') && value) {
      if (!validateInput.email(value)) {
        errors[key] = 'Please enter a valid email address';
      }
    }
    
    if (key.includes('password') && value) {
      const result = validateInput.password(value);
      if (!result.valid) {
        errors[key] = result.message;
      }
    }
    
    if (key.includes('username') && value) {
      const result = validateInput.username(value);
      if (!result.valid) {
        errors[key] = result.message;
      }
    }
    
    if (key.includes('url') && value) {
      const result = validateInput.url(value);
      if (!result.valid) {
        errors[key] = result.message;
      }
    }
    
    if (key.includes('phone') && value) {
      if (!validateInput.phone(value)) {
        errors[key] = 'Please enter a valid phone number';
      }
    }
    
    // Required field validation
    if (value === '' && key !== 'phone' && key !== 'address' && key !== 'send_confirmation') {
      errors[key] = 'This field is required';
    }
    
    // Length validation for message/description
    if ((key.includes('message') || key.includes('description')) && value) {
      if (value.length < 20) {
        errors[key] = 'Must be at least 20 characters long';
      }
      if (value.length > 2000) {
        errors[key] = 'Must be less than 2000 characters';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!csrfToken) {
      showToast('Security token not available. Please refresh the page.', 'error');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Client-side validation if enabled
    if (validate) {
      const validationErrors = {};
      
      Object.entries(data).forEach(([key, value]) => {
        const fieldErrors = validateField(key, value);
        Object.assign(validationErrors, fieldErrors);
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }
    }

    // Sanitize inputs
    const sanitizedData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key.includes('email')) {
        sanitizedData[key] = sanitizeInput.email(value);
      } else if (key.includes('url')) {
        sanitizedData[key] = sanitizeInput.url(value);
      } else if (key.includes('phone')) {
        sanitizedData[key] = sanitizeInput.phone(value);
      } else if (key.includes('message') || key.includes('description')) {
        sanitizedData[key] = sanitizeInput.html(value);
      } else {
        sanitizedData[key] = sanitizeInput.text(value);
      }
    });

    try {
      await onSubmit(sanitizedData, csrfToken);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Ensure error message is a string
      const errorMessage = error.message || error.toString() || 'Form submission failed. Please try again.';
      
      if (errorMessage.includes('CSRF')) {
        showToast('Security token expired. Please refresh the page.', 'error');
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      {errors.general && (
        <div className="error-message" style={{ marginBottom: '1rem', color: '#dc3545' }}>
          {typeof errors.general === 'string' ? errors.general : JSON.stringify(errors.general)}
        </div>
      )}
      
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const fieldName = child.props.name;
          const hasError = errors[fieldName];
          
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${hasError ? 'error' : ''}`,
            'aria-invalid': hasError ? 'true' : 'false',
            'aria-describedby': hasError ? `${fieldName}-error` : undefined,
            ...(hasError && {
              style: { 
                ...child.props.style, 
                borderColor: '#dc3545' 
              }
            }),
            ...(child.type === 'button' && child.props.type === 'submit' && {
              disabled: isSubmitting || !csrfToken
            })
          });
        }
        return child;
      })}
      
      {Object.entries(errors).map(([field, message]) => 
        field !== 'general' && (
          <div key={field} id={`${field}-error`} className="error-text" style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {typeof message === 'string' ? message : JSON.stringify(message)}
          </div>
        )
      )}
    </form>
  );
};

export default SecureForm;