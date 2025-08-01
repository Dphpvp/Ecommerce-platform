# Backend Configuration for Secure JWT Authentication

## Overview
This guide provides the necessary backend configuration to support the secure JWT authentication system implemented in the frontend. The backend needs to be updated to work with Render deployment and support cross-origin requests from Vercel.

## Required Backend Changes

### 1. JWT Authentication Endpoints

Update your authentication endpoints to return JWT tokens:

```python
# Example for Python/Flask backend
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    # ... validate credentials ...
    
    if valid_credentials:
        # Generate JWT tokens
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1)
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=30)
        )
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 3600,  # 1 hour in seconds
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'is_admin': user.is_admin,
                'is_verified': user.is_verified,
                'created_at': user.created_at.isoformat()
            }
        })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Expected registration fields from frontend:
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
    optional_fields = ['phone', 'csrf_token']
    
    # Validate required fields
    for field in required_fields:
        if not data.get(field):
            return jsonify({'detail': f'{field} is required'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        first_name=data['first_name'], 
        last_name=data['last_name'],
        phone=data.get('phone', ''),
        password_hash=generate_password_hash(data['password'])
    )
    
    # Save to database and send verification email
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'Registration successful! Please check your email.'}), 201
```

### 2. Token Refresh Endpoint

```python
@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    new_access_token = create_access_token(
        identity=current_user_id,
        expires_delta=timedelta(hours=1)
    )
    
    return jsonify({
        'access_token': new_access_token,
        'expires_in': 3600,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin
        }
    })
```

### 3. CORS Configuration for Production

For Express.js backend:

```javascript
const cors = require('cors');

app.use(cors({
    origin: [
        'https://vergishop.vercel.app',  // Your Vercel frontend domain
        'http://localhost:3000',        // Development
        'capacitor://localhost',        // Capacitor mobile
        'ionic://localhost'             // Ionic mobile
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'pragma',
        'cache-control'
    ],
    exposedHeaders: ['set-cookie']
}));
```

For Python/Flask backend:

```python
from flask_cors import CORS

CORS(app, 
     origins=[
         'https://vergishop.vercel.app',
         'http://localhost:3000',
         'capacitor://localhost',
         'ionic://localhost'
     ],
     supports_credentials=True,
     allow_headers=[
         'Content-Type',
         'Authorization',
         'X-Requested-With',
         'X-Content-Type-Options',
         'X-Frame-Options',
         'X-XSS-Protection',
         'pragma',
         'cache-control'
     ])
```

### 4. Security Headers Middleware

```javascript
// Express.js security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});
```

### 5. JWT Protected Route Example

```python
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin
    })
```

### 6. Environment Variables

Set these environment variables in your Render deployment:

```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 days

# CORS Configuration
FRONTEND_URL=https://vergishop.vercel.app
ALLOWED_ORIGINS=https://vergishop.vercel.app,http://localhost:3000

# Security
SECURE_COOKIES=true
SAME_SITE=None
```

### 7. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

// Auth specific rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: 'Too many authentication attempts'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### 8. Logout Endpoint

```python
@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # Add token to blacklist if you implement token blacklisting
    # blacklist_token(get_jwt()['jti'])
    
    return jsonify({'message': 'Successfully logged out'})
```

## Mobile App Considerations

### 1. Handle Capacitor HTTP Requests

Your backend should handle requests from Capacitor HTTP plugin the same way as regular HTTP requests. No special configuration needed.

### 2. Content-Type Headers

Ensure your backend can handle both:
- `application/json` content type from web
- Various content types from mobile apps

## Security Best Practices

### 1. Token Expiry
- Access tokens: 1 hour (short-lived)
- Refresh tokens: 30 days (long-lived)

### 2. Token Rotation
Implement refresh token rotation where a new refresh token is issued with each access token refresh.

### 3. HTTPS Only
Ensure your Render deployment uses HTTPS (enabled by default).

### 4. Input Validation
Validate all inputs, especially in authentication endpoints.

### 5. Password Security
```python
from werkzeug.security import generate_password_hash, check_password_hash

# When storing passwords
password_hash = generate_password_hash(password, method='pbkdf2:sha256')

# When verifying passwords
is_valid = check_password_hash(stored_hash, provided_password)
```

## Testing the Configuration

1. Test login endpoint returns JWT tokens
2. Test token refresh endpoint
3. Test CORS headers in browser network tab
4. Test mobile app authentication
5. Test rate limiting
6. Test security headers

## Common Issues and Solutions

### Issue: CORS errors in production
**Solution**: Ensure `credentials: true` and specific origins (not `*`)

### Issue: Tokens not refreshing
**Solution**: Check refresh token endpoint and ensure proper JWT configuration

### Issue: Mobile app auth failing
**Solution**: Add Capacitor origins to CORS configuration

### Issue: Rate limiting too aggressive
**Solution**: Adjust rate limiting windows and limits based on usage patterns

## Deployment Checklist

- [ ] JWT secret key set in environment variables
- [ ] CORS configured with production frontend URL
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] Token refresh endpoint working
- [ ] Mobile origins added to CORS
- [ ] Error handling implemented
- [ ] Logging configured for debugging

This configuration will provide a secure, scalable authentication system that works reliably across web and mobile platforms with your Render backend and Vercel frontend setup.