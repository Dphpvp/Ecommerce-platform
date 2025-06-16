# backend/middleware/rate_limiter.py
import time
import json
import os
from typing import Dict, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import asyncio
import aiofiles
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self):
        # Use file-based storage for Render deployment
        self.storage_file = "/tmp/rate_limits.json"  # Render has /tmp for temp files
        self.attempts = {}
        self.last_cleanup = time.time()
        self.load_from_file()
        
    def load_from_file(self):
        """Load rate limit data from file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    self.attempts = json.load(f)
        except Exception as e:
            print(f"Failed to load rate limits: {e}")
            self.attempts = {}
    
    def save_to_file(self):
        """Save rate limit data to file"""
        try:
            # Clean old entries before saving
            current_time = time.time()
            if current_time - self.last_cleanup > 300:  # Clean every 5 minutes
                self.cleanup_expired_entries()
                self.last_cleanup = current_time
            
            os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
            with open(self.storage_file, 'w') as f:
                json.dump(self.attempts, f)
        except Exception as e:
            print(f"Failed to save rate limits: {e}")
    
    def cleanup_expired_entries(self):
        """Remove expired entries to prevent file growth"""
        current_time = time.time()
        expired_keys = []
        
        for key, data in self.attempts.items():
            # Remove entries older than 24 hours
            if data.get('reset_time', 0) < current_time - 86400:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.attempts[key]
    
    def get_client_ip(self, request: Request) -> str:
        """Extract real client IP from headers for deployed environment"""
        # Check multiple headers that proxies might use
        headers_to_check = [
            "cf-connecting-ip",      # Cloudflare
            "x-forwarded-for",       # Standard proxy header
            "x-real-ip",             # Nginx
            "x-client-ip",           # Apache
            "x-forwarded",           # Some proxies
            "forwarded-for",         # Some proxies
            "forwarded"              # RFC 7239
        ]
        
        for header in headers_to_check:
            ip = request.headers.get(header)
            if ip:
                # X-Forwarded-For can contain multiple IPs
                return ip.split(",")[0].strip()
        
        # Fallback to request client
        return request.client.host if request.client else "unknown"
    
    def is_rate_limited(self, key: str, max_attempts: int, window_minutes: int) -> tuple[bool, dict]:
        """Check if key is rate limited"""
        current_time = time.time()
        
        if key not in self.attempts:
            self.attempts[key] = {
                'count': 0,
                'reset_time': current_time + (window_minutes * 60),
                'blocked_until': None,
                'block_level': 0
            }
        
        client_data = self.attempts[key]
        
        # Check if client is temporarily blocked
        if client_data.get('blocked_until') and current_time < client_data['blocked_until']:
            remaining_time = int(client_data['blocked_until'] - current_time)
            return True, {
                'error': 'rate_limit_exceeded',
                'message': f'Too many attempts. Try again in {remaining_time} seconds.',
                'retry_after': remaining_time
            }
        
        # Reset window if expired
        if current_time > client_data['reset_time']:
            client_data['count'] = 0
            client_data['reset_time'] = current_time + (window_minutes * 60)
            client_data['blocked_until'] = None
        
        # Check if limit exceeded
        if client_data['count'] >= max_attempts:
            # Progressive blocking
            block_times = [300, 900, 3600, 86400]  # 5min, 15min, 1hr, 24hr
            block_level = min(client_data.get('block_level', 0), len(block_times) - 1)
            block_duration = block_times[block_level]
            
            client_data['blocked_until'] = current_time + block_duration
            client_data['block_level'] = client_data.get('block_level', 0) + 1
            
            self.save_to_file()
            
            return True, {
                'error': 'rate_limit_exceeded',
                'message': f'Too many attempts. Blocked for {block_duration // 60} minutes.',
                'retry_after': block_duration
            }
        
        return False, {}
    
    def record_attempt(self, key: str, success: bool = False):
        """Record an attempt"""
        current_time = time.time()
        
        if key not in self.attempts:
            self.attempts[key] = {
                'count': 0,
                'reset_time': current_time + 900,  # 15 minutes default
                'blocked_until': None,
                'block_level': 0
            }
        
        client_data = self.attempts[key]
        
        if success:
            # Reset on successful auth
            client_data['count'] = 0
            client_data['blocked_until'] = None
            client_data['block_level'] = 0
        else:
            client_data['count'] += 1
        
        self.save_to_file()

# Global rate limiter instance
rate_limiter = RateLimiter()

# Rate limiting decorator for specific endpoints
def rate_limit(max_attempts: int, window_minutes: int, endpoint_name: str):
    """Decorator for rate limiting specific endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request from kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                for value in kwargs.values():
                    if isinstance(value, Request):
                        request = value
                        break
            
            if not request:
                # If no request found, proceed without rate limiting
                return await func(*args, **kwargs)
            
            client_ip = rate_limiter.get_client_ip(request)
            key = f"{endpoint_name}:{client_ip}"
            
            # Check rate limit
            is_limited, error_data = rate_limiter.is_rate_limited(key, max_attempts, window_minutes)
            if is_limited:
                raise HTTPException(status_code=429, detail=error_data)
            
            # Record attempt
            rate_limiter.record_attempt(key, success=False)
            
            try:
                # Call the original function
                result = await func(*args, **kwargs)
                
                # Record success for auth endpoints
                if endpoint_name in ['login', '2fa'] and isinstance(result, dict):
                    if 'token' in result or 'requires_2fa' in result:
                        rate_limiter.record_attempt(key, success=True)
                elif endpoint_name == 'password_reset':
                    rate_limiter.record_attempt(key, success=True)
                
                return result
                
            except HTTPException as e:
                # Don't record success for HTTP errors
                raise e
            except Exception as e:
                # Re-raise other exceptions
                raise e
        
        return wrapper
    return decorator