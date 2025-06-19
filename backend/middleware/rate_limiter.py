# backend/middleware/rate_limiter.py - REDIS-BASED RATE LIMITER

import time
import json
import os
import asyncio
from typing import Dict, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta
import redis.asyncio as redis

class RedisRateLimiter:
    """Production-ready rate limiter using Redis for persistence"""
    
    def __init__(self):
        # Use Redis for production, fallback to memory for development
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = None
        self.fallback_storage = {}  # Memory fallback if Redis unavailable
        self.use_redis = True
        
    async def init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                retry_on_timeout=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            await self.redis_client.ping()
            print("✅ Redis connected for rate limiting")
        except Exception as e:
            print(f"⚠️ Redis connection failed, using memory fallback: {e}")
            self.use_redis = False
    
    async def close_redis(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
    
    def get_client_ip(self, request: Request) -> str:
        """Extract real client IP from headers"""
        headers_to_check = [
            "cf-connecting-ip",      # Cloudflare
            "x-forwarded-for",       # Standard proxy header
            "x-real-ip",             # Nginx
            "x-client-ip",           # Apache
            "forwarded-for",         # Some proxies
        ]
        
        for header in headers_to_check:
            ip = request.headers.get(header)
            if ip:
                return ip.split(",")[0].strip()
        
        return request.client.host if request.client else "unknown"
    
    async def is_rate_limited(self, key: str, max_attempts: int, window_seconds: int) -> tuple[bool, dict]:
        """Check if key is rate limited using Redis or memory fallback"""
        if self.use_redis and self.redis_client:
            return await self._redis_rate_limit(key, max_attempts, window_seconds)
        else:
            return await self._memory_rate_limit(key, max_attempts, window_seconds)
    
    async def _redis_rate_limit(self, key: str, max_attempts: int, window_seconds: int) -> tuple[bool, dict]:
        """Redis-based rate limiting with sliding window"""
        current_time = int(time.time())
        window_start = current_time - window_seconds
        
        pipe = self.redis_client.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current requests in window
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(current_time): current_time})
        
        # Set expiry
        pipe.expire(key, window_seconds)
        
        try:
            results = await pipe.execute()
            current_count = results[1]  # Count after cleanup
            
            if current_count >= max_attempts:
                # Check if user is in penalty box
                penalty_key = f"{key}:penalty"
                penalty_until = await self.redis_client.get(penalty_key)
                
                if penalty_until and current_time < int(penalty_until):
                    remaining_time = int(penalty_until) - current_time
                    return True, {
                        'error': 'rate_limit_exceeded',
                        'message': f'Too many attempts. Try again in {remaining_time} seconds.',
                        'retry_after': remaining_time,
                        'penalty': True
                    }
                
                # Apply progressive penalty
                penalty_duration = min(300 * (current_count // max_attempts), 3600)  # Max 1 hour
                await self.redis_client.setex(penalty_key, penalty_duration, current_time + penalty_duration)
                
                return True, {
                    'error': 'rate_limit_exceeded',
                    'message': f'Rate limit exceeded. Blocked for {penalty_duration} seconds.',
                    'retry_after': penalty_duration,
                    'attempts': current_count,
                    'max_attempts': max_attempts
                }
            
            return False, {'attempts': current_count, 'max_attempts': max_attempts}
            
        except Exception as e:
            print(f"Redis rate limit error: {e}")
            # Fallback to memory-based rate limiting
            return await self._memory_rate_limit(key, max_attempts, window_seconds)
    
    async def _memory_rate_limit(self, key: str, max_attempts: int, window_seconds: int) -> tuple[bool, dict]:
        """Memory-based fallback rate limiting"""
        current_time = time.time()
        
        if key not in self.fallback_storage:
            self.fallback_storage[key] = {
                'attempts': [],
                'blocked_until': None,
                'penalty_count': 0
            }
        
        user_data = self.fallback_storage[key]
        
        # Check if still blocked
        if user_data['blocked_until'] and current_time < user_data['blocked_until']:
            remaining_time = int(user_data['blocked_until'] - current_time)
            return True, {
                'error': 'rate_limit_exceeded',
                'message': f'Too many attempts. Try again in {remaining_time} seconds.',
                'retry_after': remaining_time
            }
        
        # Clean old attempts
        window_start = current_time - window_seconds
        user_data['attempts'] = [t for t in user_data['attempts'] if t > window_start]
        
        # Check rate limit
        if len(user_data['attempts']) >= max_attempts:
            # Progressive blocking
            user_data['penalty_count'] += 1
            block_duration = min(300 * user_data['penalty_count'], 3600)  # Max 1 hour
            user_data['blocked_until'] = current_time + block_duration
            
            return True, {
                'error': 'rate_limit_exceeded',
                'message': f'Rate limit exceeded. Blocked for {block_duration} seconds.',
                'retry_after': block_duration
            }
        
        # Add current attempt
        user_data['attempts'].append(current_time)
        
        return False, {'attempts': len(user_data['attempts']), 'max_attempts': max_attempts}
    
    async def record_success(self, key: str):
        """Record successful operation (resets penalty)"""
        if self.use_redis and self.redis_client:
            penalty_key = f"{key}:penalty"
            await self.redis_client.delete(penalty_key)
        elif key in self.fallback_storage:
            self.fallback_storage[key]['penalty_count'] = 0
            self.fallback_storage[key]['blocked_until'] = None
    
    async def cleanup_expired(self):
        """Cleanup expired entries (for memory fallback)"""
        if not self.use_redis:
            current_time = time.time()
            keys_to_remove = []
            
            for key, data in self.fallback_storage.items():
                # Remove if no recent activity and not blocked
                if (not data['blocked_until'] or current_time > data['blocked_until']) and \
                   (not data['attempts'] or max(data['attempts'], default=0) < current_time - 3600):
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self.fallback_storage[key]

# Global rate limiter instance
rate_limiter = RedisRateLimiter()

# Enhanced rate limiting decorator
def rate_limit(max_attempts: int, window_seconds: int, endpoint_name: str):
    """Enhanced rate limiting decorator with Redis support"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract request from arguments
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
                return await func(*args, **kwargs)
            
            client_ip = rate_limiter.get_client_ip(request)
            key = f"rate_limit:{endpoint_name}:{client_ip}"
            
            # Check rate limit
            is_limited, error_data = await rate_limiter.is_rate_limited(key, max_attempts, window_seconds)
            if is_limited:
                raise HTTPException(status_code=429, detail=error_data)
            
            try:
                # Call the original function
                result = await func(*args, **kwargs)
                
                # Record success for auth endpoints
                if endpoint_name in ['login', '2fa'] and isinstance(result, dict):
                    if 'token' in result or 'requires_2fa' in result or result.get('success'):
                        await rate_limiter.record_success(key)
                
                return result
                
            except HTTPException as e:
                # Don't record success for HTTP errors
                raise e
            except Exception as e:
                # Re-raise other exceptions
                raise e
        
        return wrapper
    return decorator

# Startup and shutdown handlers for FastAPI
async def setup_rate_limiter():
    """Initialize rate limiter on startup"""
    await rate_limiter.init_redis()

async def shutdown_rate_limiter():
    """Cleanup rate limiter on shutdown"""
    await rate_limiter.close_redis()

# Middleware for general rate limiting
async def rate_limit_middleware(request: Request, call_next):
    """General rate limiting middleware"""
    client_ip = rate_limiter.get_client_ip(request)
    
    # Apply general rate limiting (adjust limits as needed)
    if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
        key = f"rate_limit:general:{client_ip}"
        is_limited, error_data = await rate_limiter.is_rate_limited(key, 60, 60)  # 60 requests per minute
        
        if is_limited:
            return JSONResponse(
                status_code=429,
                content=error_data
            )
    
    response = await call_next(request)
    return response