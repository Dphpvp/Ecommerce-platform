// frontend/src/components/SecureForm.js
import React, { useState, useEffect } from 'react';
import { csrfManager, sanitizeInput, validateInput } from '../utils/csrf';

const SecureForm = ({ 
  onSubmit, 
  children, 
  validate = true, 
  className = "",
  ...props 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Client-side validation if enabled
    if (validate) {
      const validationErrors = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (key.includes('email') && value) {
          if (!validateInput.email(value)) {
            validationErrors[key] = 'Invalid email format';
          }
        }
        
        if (key.includes('password') && value) {
          const result = validateInput.password(value);
          if (!result.valid) {
            validationErrors[key] = result.message;
          }
        }
        
        if (key.includes('username') && value) {
          const result = validateInput.username(value);
          if (!result.valid) {
            validationErrors[key] = result.message;
          }
        }
        
        if (key.includes('url') && value) {
          const result = validateInput.url(value);
          if (!result.valid) {
            validationErrors[key] = result.message;
          }
        }
        
        if (key.includes('phone') && value) {
          if (!validateInput.phone(value)) {
            validationErrors[key] = 'Invalid phone format';
          }
        }
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
      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ general: 'Form submission failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      {errors.general && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {errors.general}
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
              disabled: isSubmitting
            })
          });
        }
        return child;
      })}
      
      {Object.entries(errors).map(([field, message]) => 
        field !== 'general' && (
          <div key={field} id={`${field}-error`} className="error-text" style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {message}
          </div>
        )
      )}
    </form>
  );
};

// Secure input components
export const SecureInput = ({ sanitize = 'text', validate: validateType, ...props }) => {
  const [value, setValue] = useState(props.defaultValue || '');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Apply sanitization
    switch (sanitize) {
      case 'email':
        newValue = sanitizeInput.email(newValue);
        break;
      case 'phone':
        newValue = sanitizeInput.phone(newValue);
        break;
      case 'html':
        newValue = sanitizeInput.html(newValue);
        break;
      default:
        newValue = sanitizeInput.text(newValue);
    }
    
    setValue(newValue);
    
    // Apply validation
    if (validateType && newValue) {
      const result = validateInput[validateType]?.(newValue);
      if (result && !result.valid) {
        setError(result.message);
      } else {
        setError('');
      }
    }
    
    if (props.onChange) {
      e.target.value = newValue;
      props.onChange(e);
    }
  };

  return (
    <div>
      <input 
        {...props} 
        value={value}
        onChange={handleChange}
        style={{
          ...props.style,
          ...(error && { borderColor: '#dc3545' })
        }}
      />
      {error && (
        <div style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export const SecureTextarea = ({ sanitize = 'html', maxLength = 2000, ...props }) => {
  const [value, setValue] = useState(props.defaultValue || '');
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Apply sanitization
    if (sanitize === 'html') {
      newValue = sanitizeInput.html(newValue);
    } else {
      newValue = sanitizeInput.text(newValue, maxLength);
    }
    
    if (newValue.length <= maxLength) {
      setValue(newValue);
      setCharCount(newValue.length);
      
      if (props.onChange) {
        e.target.value = newValue;
        props.onChange(e);
      }
    }
  };

  return (
    <div>
      <textarea 
        {...props} 
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
      />
      <div style={{ 
        textAlign: 'right', 
        fontSize: '0.8rem', 
        color: charCount > maxLength * 0.9 ? '#dc3545' : '#6c757d',
        marginTop: '0.25rem'
      }}>
        {charCount}/{maxLength}
      </div>
    </div>
  );
};

export default SecureForm;