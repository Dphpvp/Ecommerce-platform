from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from api.services.upload_service import UploadService
from api.dependencies.auth import get_current_user_from_session, require_csrf_token
from api.core.logging import get_logger

router = APIRouter()
upload_service = UploadService()
logger = get_logger(__name__)

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: dict = Depends(get_current_user_from_session),
    csrf_valid: bool = Depends(require_csrf_token)
):
    """Upload user avatar image"""
    try:
        result = await upload_service.upload_avatar(file, current_user)
        logger.info(f"Avatar uploaded for user: {current_user['email']}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@router.delete("/avatar")
async def delete_avatar(
    request: Request = None,
    current_user: dict = Depends(get_current_user_from_session),
    csrf_valid: bool = Depends(require_csrf_token)
):
    """Delete user avatar and reset to default"""
    try:
        result = await upload_service.delete_avatar(current_user)
        logger.info(f"Avatar deleted for user: {current_user['email']}")
        return result
    except Exception as e:
        logger.error(f"Avatar deletion error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete avatar")

@router.get("/avatar/samples")
async def get_avatar_samples(
    current_user: dict = Depends(get_current_user_from_session)
):
    """Get sample avatar options"""
    username = current_user['username']
    samples = [
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}1",
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}2", 
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}3",
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}4",
        f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}5",
        f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}1",
        f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}2",
        f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}3",
        f"https://api.dicebear.com/7.x/personas/svg?seed={username}1",
        f"https://api.dicebear.com/7.x/personas/svg?seed={username}2"
    ]
    
    return {
        "message": "Avatar samples available",
        "avatars": samples
    }