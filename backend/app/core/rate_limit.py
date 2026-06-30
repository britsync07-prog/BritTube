"""
Rate limiting middleware for BritTube.
Protects auth endpoints from brute force and video generation from abuse.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Global limiter instance
limiter = Limiter(key_func=get_remote_address)


def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later.",
            "retry_after": str(exc.detail),
        },
    )


# Rate limit configurations
AUTH_RATE = "5/minute"        # Login/register: 5 per minute per IP
VIDEO_RATE = "3/minute"       # Video generation: 3 per minute per user
API_RATE = "30/minute"        # General API: 30 per minute per IP
ADMIN_RATE = "60/minute"      # Admin endpoints: 60 per minute per user
