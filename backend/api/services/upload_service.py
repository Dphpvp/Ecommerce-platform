import os
import uuid
import aiofiles
from PIL import Image
from fastapi import HTTPException, UploadFile
from api.core.database import get_database
from api.core.config import get_settings
from api.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

class UploadService:
    def __init__(self):
        self.db = get_database()
        self.upload_dir = "uploads"
        self.avatar_dir = os.path.join(self.upload_dir, "avatars")
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        self.allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        
        # Create directories
        os.makedirs(self.avatar_dir, exist_ok=True)
    
    def _validate_image_file(self, file: UploadFile) -> None:
        """Validate uploaded image file"""
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files allowed")
        
        if file.size and file.size > self.max_file_size:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in self.allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {', '.join(self.allowed_extensions)}"
            )
    
    def _generate_filename(self, user_id: str, original_filename: str) -> str:
        """Generate unique filename for uploaded file"""
        file_ext = original_filename.split('.')[-1].lower()
        return f"{user_id}_{uuid.uuid4().hex[:8]}.{file_ext}"
    
    async def _resize_image(self, file_path: str) -> None:
        """Resize and optimize image"""
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if needed
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                
                # Resize to 200x200 maintaining aspect ratio
                img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                
                # Save optimized
                img.save(file_path, quality=85, optimize=True)
                
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid image file")
    
    def _cleanup_old_avatar(self, user: dict) -> None:
        """Remove old avatar file if it's a local upload"""
        old_url = user.get("profile_image_url", "")
        if old_url and "/uploads/avatars/" in old_url:
            try:
                filename = old_url.split("/")[-1]
                old_path = os.path.join(self.avatar_dir, filename)
                if os.path.exists(old_path):
                    os.remove(old_path)
                    logger.info(f"Cleaned up old avatar: {filename}")
            except Exception as e:
                logger.warning(f"Failed to cleanup old avatar: {e}")
    
    async def upload_avatar(self, file: UploadFile, user: dict) -> dict:
        """Upload and process user avatar"""
        self._validate_image_file(file)
        
        filename = self._generate_filename(str(user["_id"]), file.filename)
        file_path = os.path.join(self.avatar_dir, filename)
        
        try:
            # Save uploaded file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Resize and optimize
            await self._resize_image(file_path)
            
            # Generate URL
            avatar_url = f"{settings.BACKEND_URL}/uploads/avatars/{filename}"
            
            # Clean up old avatar
            self._cleanup_old_avatar(user)
            
            # Update user profile
            await self.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"profile_image_url": avatar_url}}
            )
            
            logger.info(f"Avatar uploaded for user {user['email']}: {filename}")
            
            return {
                "avatar_url": avatar_url,
                "message": "Avatar uploaded successfully"
            }
            
        except HTTPException:
            # Clean up on validation error
            if os.path.exists(file_path):
                os.remove(file_path)
            raise
        except Exception as e:
            # Clean up on any error
            if os.path.exists(file_path):
                os.remove(file_path)
            logger.error(f"Avatar upload failed: {e}")
            raise HTTPException(status_code=500, detail="Upload failed")
    
    async def delete_avatar(self, user: dict) -> dict:
        """Delete user's current avatar and reset to default"""
        self._cleanup_old_avatar(user)
        
        # Reset to default avatar
        default_avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user['username']}"
        
        await self.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"profile_image_url": default_avatar}}
        )
        
        return {
            "avatar_url": default_avatar,
            "message": "Avatar reset to default"
        }