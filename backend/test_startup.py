#!/usr/bin/env python3
import os
import sys

# Test basic imports
try:
    print("Testing imports...")
    from api.core.config import get_settings
    print("Config import successful")
    
    settings = get_settings()
    print(f"Settings loaded: {settings.ENVIRONMENT}")
    
    from api.core.database import get_database
    print("Database import successful")
    
    from api.services.auth_service import AuthService
    print("Auth service import successful")
    
    print("All imports successful!")
    
except Exception as e:
    print(f"Import error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)