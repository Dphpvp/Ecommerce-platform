import React, { useState, useEffect } from 'react';

const MobileCaptcha = ({ onComplete, onError }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const generateQuestion = () => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, result;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        result = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 30) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        result = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        result = num1 * num2;
        break;
      default:
        num1 = 2;
        num2 = 2;
        result = 4;
    }
    
    setQuestion(`${num1} ${operation} ${num2} = ?`);
    setCorrectAnswer(result);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserAnswer(value);
    
    const numericValue = parseInt(value);
    if (numericValue === correctAnswer) {
      setIsValid(true);
      const token = generateMobileToken();
      if (onComplete) {
        onComplete(token);
      }
    } else {
      setIsValid(false);
    }
  };

  const generateMobileToken = () => {
    const timestamp = Date.now();
    const data = {
      type: 'mobile_math',
      question: question,
      answer: correctAnswer,
      timestamp: timestamp,
      attempts: attempts + 1
    };
    
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      // Fallback for older Android devices
      return `mobile_${timestamp}_${correctAnswer}`;
    }
  };

  const handleRefresh = () => {
    setAttempts(prev => prev + 1);
    setUserAnswer('');
    setIsValid(false);
    generateQuestion();
  };

  return (
    <div className="mobile-captcha" style={styles.container}>
      <div style={styles.question}>
        <label htmlFor="mobile-captcha-input" style={styles.label}>
          Security Check: {question}
        </label>
      </div>
      
      <div style={styles.inputContainer}>
        <input
          id="mobile-captcha-input"
          type="number"
          value={userAnswer}
          onChange={handleInputChange}
          placeholder="Enter answer"
          style={{
            ...styles.input,
            borderColor: isValid ? '#4CAF50' : (userAnswer && !isValid ? '#f44336' : '#ddd')
          }}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        
        <button
          type="button"
          onClick={handleRefresh}
          style={styles.refreshButton}
          title="New question"
        >
          ↻
        </button>
      </div>
      
      {isValid && (
        <div style={styles.success}>
          ✓ Correct!
        </div>
      )}
      
      {userAnswer && !isValid && (
        <div style={styles.error}>
          ✗ Incorrect, try again
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    margin: '10px 0',
    textAlign: 'center'
  },
  question: {
    marginBottom: '10px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  input: {
    padding: '8px 12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    width: '100px',
    textAlign: 'center'
  },
  refreshButton: {
    padding: '8px 12px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  success: {
    color: '#4CAF50',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  error: {
    color: '#f44336',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default MobileCaptcha;