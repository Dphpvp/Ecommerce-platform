import os
import uuid
import cloudinary
import cloudinary.uploader
from PIL import Image
from io import BytesIO
from fastapi import HTTPException, UploadFile
from api.core.database import get_database
from api.core.config import get_settings
from api.core.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

class UploadService:
    def __init__(self):
        self.db = get_database()
        self.max_file_size = 5 * 1024 * 1024  # 5MB
        self.allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
    
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
    
    def _generate_public_id(self, user_id: str) -> str:
        """Generate unique public ID for Cloudinary"""
        return f"avatars/{user_id}_{uuid.uuid4().hex[:8]}"
    
    async def _process_image(self, file_content: bytes) -> bytes:
        """Resize and optimize image"""
        try:
            img = Image.open(BytesIO(file_content))
            
            # Convert to RGB if needed
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Resize to 200x200 maintaining aspect ratio
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid image file")
    
    async def _cleanup_old_avatar(self, user: dict) -> None:
        """Remove old avatar from Cloudinary"""
        old_url = user.get("profile_image_url", "")
        if old_url and "cloudinary.com" in old_url:
            try:
                # Extract public_id from Cloudinary URL
                # URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/public_id.jpg
                parts = old_url.split('/')
                if len(parts) >= 2:
                    public_id = parts[-1].split('.')[0]  # Remove extension
                    if '/' in old_url and 'avatars/' in old_url:
                        # Get full path including folder
                        idx = old_url.find('avatars/')
                        end_idx = old_url.rfind('.')
                        if idx != -1 and end_idx != -1:
                            public_id = old_url[idx:end_idx]
                    
                    cloudinary.uploader.destroy(public_id)
                    logger.info(f"Cleaned up old avatar: {public_id}")
            except Exception as e:
                logger.warning(f"Failed to cleanup old avatar: {e}")
    
    async def upload_avatar(self, file: UploadFile, user: dict) -> dict:
        """Upload and process user avatar to Cloudinary"""
        self._validate_image_file(file)
        
        try:
            # Read and process file
            file_content = await file.read()
            processed_content = await self._process_image(file_content)
            
            # Generate unique public ID
            public_id = self._generate_public_id(str(user["_id"]))
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                processed_content,
                public_id=public_id,
                folder="avatars",
                resource_type="image",
                format="jpg",
                transformation=[
                    {"width": 200, "height": 200, "crop": "fill", "gravity": "face"},
                    {"quality": "auto", "fetch_format": "auto"}
                ]
            )
            
            avatar_url = result["secure_url"]
            
            # Clean up old avatar
            await self._cleanup_old_avatar(user)
            
            # Update user profile
            await self.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"profile_image_url": avatar_url}}
            )
            
            logger.info(f"Avatar uploaded for user {user['email']}: {public_id}")
            
            return {
                "avatar_url": avatar_url,
                "public_id": public_id,
                "message": "Avatar uploaded successfully"
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Avatar upload failed: {e}")
            raise HTTPException(status_code=500, detail="Upload failed")
    
    async def delete_avatar(self, user: dict) -> dict:
        """Delete user's current avatar and reset to default"""
        await self._cleanup_old_avatar(user)
        
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