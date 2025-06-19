from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.profile import UserProfileUpdate
from api.models.responses import MessageResponse, UserResponse
from api.dependencies.auth import get_current_user_from_session, require_csrf_token

router = APIRouter()

@router.put("/update")
async def update_profile(
    profile_request: UserProfileUpdate,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        # Profile update logic here
        return MessageResponse(message="Profile updated successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))