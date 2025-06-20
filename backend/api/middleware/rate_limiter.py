import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import HTTPException, Request
from functools import wraps

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = defaultdict(list)
        self.blocked_ips: Dict[str, float] = {}
    
    def is_allowed(self, key: str, max_requests: int, window: int) -> bool:
        now = time.time()
        
        # Check if IP is temporarily blocked
        if key in self.blocked_ips:
            if now < self.blocked_ips[key]:
                return False
            else:
                del self.blocked_ips[key]
        
        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] if now - req_time < window]
        
        # Check limit
        if len(self.requests[key]) >= max_requests:
            # Block IP for additional time if severely over limit
            if len(self.requests[key]) > max_requests * 2:
                self.blocked_ips[key] = now + 300  # 5 minute block
            return False
        
        # Add current request
        self.requests[key].append(now)
        return True
    
    def clear_expired(self):
        now = time.time()
        # Clear expired blocked IPs
        self.blocked_ips = {ip: exp_time for ip, exp_time in self.blocked_ips.items() if exp_time > now}

def get_client_ip(request: Request) -> str:
    # Try to get real IP from headers (for proxy/load balancer setups)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(max_attempts: int, window_minutes: int, endpoint_name: str):
    """Decorator for rate limiting endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
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
            
            if request:
                client_ip = get_client_ip(request)
                window_seconds = window_minutes * 60
                
                if not rate_limiter.is_allowed(f"{client_ip}:{endpoint_name}", max_attempts, window_seconds):
                    raise HTTPException(
                        status_code=429, 
                        detail=f"Too many {endpoint_name} attempts. Try again later."
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator