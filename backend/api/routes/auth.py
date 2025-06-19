from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import timedelta

from api.services.auth_service import AuthService
from api.services.two_factor_service import TwoFactorService
from api.models.auth import (
    UserLoginRequest, 
    UserRegisterRequest, 
    GoogleLoginRequest,
    TwoFactorSetupRequest,
    TwoFactorVerificationRequest,
    PasswordResetRequest,
    PasswordChangeRequest,
    EmailVerificationRequest
)
from api.models.responses import (
    AuthResponse, 
    TwoFactorSetupResponse, 
    MessageResponse
)
from api.dependencies.auth import get_current_user_optional, require_csrf_token
from api.dependencies.rate_limiting import rate_limit
from api.core.exceptions import AuthenticationError, ValidationError
from api.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Services
auth_service = AuthService()
two_factor_service = TwoFactorService()

@router.post("/register", response_model=MessageResponse)
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="register")
async def register(
    request: UserRegisterRequest,
    http_request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
) -> MessageResponse:
    """Register new user account."""
    try:
        await auth_service.register_user(request, http_request)
        logger.info(f"User registered successfully: {request.email}")
        return MessageResponse(message="User registered successfully. Please verify your email.")
    except ValidationError as e:
        logger.warning(f"Registration validation failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login", response_model=AuthResponse)
@rate_limit(max_attempts=5, window_minutes=15, endpoint_name="login")
async def login(
    request: UserLoginRequest,
    http_request: Request,
    response: Response
) -> AuthResponse:
    """Authenticate user login."""
    try:
        auth_response = await auth_service.authenticate_user(request, http_request, response)
        logger.info(f"User login successful: {request.identifier}")
        return auth_response
    except AuthenticationError as e:
        logger.warning(f"Login failed: {e.detail}")
        raise HTTPException(status_code=401, detail=e.detail)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/logout")
async def logout(response: Response) -> MessageResponse:
    """Logout user and clear session."""
    auth_service.clear_session(response)
    logger.info("User logged out successfully")
    return MessageResponse(message="Logged out successfully")

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(request: EmailVerificationRequest) -> MessageResponse:
    """Verify user email address."""
    try:
        await auth_service.verify_email(request.token)
        logger.info(f"Email verified successfully for token: {request.token[:8]}...")
        return MessageResponse(message="Email verified successfully")
    except ValidationError as e:
        logger.warning(f"Email verification failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

@router.post("/google", response_model=AuthResponse)
async def google_login(
    request: GoogleLoginRequest,
    response: Response
) -> AuthResponse:
    """Authenticate with Google OAuth."""
    try:
        auth_response = await auth_service.google_authenticate(request, response)
        logger.info("Google authentication successful")
        return auth_response
    except AuthenticationError as e:
        logger.warning(f"Google auth failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

@router.post("/setup-2fa", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    request: TwoFactorSetupRequest,
    http_request: Request,
    current_user: dict = Depends(get_current_user_optional),
    csrf_valid: bool = Depends(require_csrf_token)
) -> TwoFactorSetupResponse:
    """Setup two-factor authentication."""
    try:
        setup_response = await two_factor_service.setup_2fa(request, current_user)
        logger.info(f"2FA setup initiated for user: {current_user['email']}")
        return setup_response
    except ValidationError as e:
        logger.warning(f"2FA setup validation failed: {e.detail}")
        raise HTTPException(status_code=400, detail=e.detail)

@router.post("/verify-2fa", response_model=AuthResponse)
async def verify_2fa(
    request: TwoFactorVerificationRequest,
    response: Response
) -> AuthResponse:
    """Verify two-factor authentication code."""
    try:
        auth_response = await two_factor_service.verify_2fa_login(request, response)
        logger.info("2FA verification successful")
        return auth_response
    except AuthenticationError as e:
        logger.warning(f"2FA verification failed: {e.detail}")
        raise HTTPException(status_code=401, detail=e.detail)