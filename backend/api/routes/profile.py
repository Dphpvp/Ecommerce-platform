from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.profile import UserProfileUpdate
from api.models.responses import MessageResponse, UserResponse
from api.dependencies.auth import get_current_user_from_session, require_csrf_token
from api.core.database import get_database
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

@router.put("/update")
async def update_profile(
    profile_request: UserProfileUpdate,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        user_id = str(user["_id"])
        db = get_database()
        
        # Build update data
        update_data = {}
        if profile_request.full_name is not None:
            update_data["full_name"] = profile_request.full_name.strip()
        if profile_request.email is not None:
            update_data["email"] = profile_request.email.strip()
        if profile_request.phone is not None:
            update_data["phone"] = profile_request.phone.strip()
        if profile_request.address is not None:
            update_data["address"] = profile_request.address.strip()
        if profile_request.profile_image_url is not None:
            update_data["profile_image_url"] = profile_request.profile_image_url
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Update user
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return updated user data
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        return {
            "message": "Profile updated successfully",
            "user": UserResponse.from_dict(updated_user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/avatar")
async def get_avatar_options(request: Request):
    try:
        user = await get_current_user_from_session(request)
        
        sample_avatars = [
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}1",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}2", 
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}3",
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={user['username']}1",
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={user['username']}2"
        ]
        
        return {"avatars": sample_avatars}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to load avatars")
