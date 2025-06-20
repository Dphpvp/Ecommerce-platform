from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.profile import UserProfileUpdate
from api.models.responses import MessageResponse, UserResponse
from api.dependencies.auth import get_current_user_from_session, require_csrf_token
from api.core.database import get_database
from api.core.logging import get_logger
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()
logger = get_logger(__name__)

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
            # Check if email is already taken by another user
            existing_user = await db.users.find_one({
                "email": profile_request.email.strip().lower(),
                "_id": {"$ne": ObjectId(user_id)}
            })
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_data["email"] = profile_request.email.strip().lower()
        if profile_request.phone is not None:
            # Check if phone is already taken by another user
            if profile_request.phone.strip():
                existing_user = await db.users.find_one({
                    "phone": profile_request.phone.strip(),
                    "_id": {"$ne": ObjectId(user_id)}
                })
                if existing_user:
                    raise HTTPException(status_code=400, detail="Phone number already in use")
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
        
        logger.info(f"Profile updated for user: {updated_user['email']}")
        
        return {
            "message": "Profile updated successfully",
            "user": UserResponse.from_dict(updated_user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/avatar")
async def get_avatar_options(request: Request):
    try:
        user = await get_current_user_from_session(request)
        
        # Generate sample avatar URLs based on username
        username = user['username']
        sample_avatars = [
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
            "message": "Avatar options available",
            "avatars": sample_avatars
        }
    except Exception as e:
        logger.error(f"Avatar endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load avatars")

@router.get("/me")
async def get_profile(request: Request):
    try:
        user = await get_current_user_from_session(request)
        return UserResponse.from_dict(user)
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(status_code=401, detail="Authentication required")

@router.delete("")
async def delete_profile(
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        user = await get_current_user_from_session(request)
        user_id = str(user["_id"])
        db = get_database()
        
        # Don't allow admin users to delete themselves if they're the only admin
        if user.get("is_admin", False):
            admin_count = await db.users.count_documents({"is_admin": True})
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot delete the last admin account")
        
        # Delete user's cart
        await db.cart.delete_many({"user_id": user_id})
        
        # Update orders to anonymize user data instead of deleting
        await db.orders.update_many(
            {"user_id": user_id},
            {"$set": {"user_deleted": True, "deleted_at": datetime.now(timezone.utc)}}
        )
        
        # Delete the user
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"User account deleted: {user['email']}")
        
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete profile error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete account")