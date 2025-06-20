# This file provides compatibility for imports from api.py
# Redirect imports to the new structured API

from api.dependencies.auth import (
    get_current_user_from_session,
    get_admin_user,
    require_csrf_token,
    get_current_user_optional
)
from api.core.database import get_database

# Create db instance for backward compatibility
db = get_database()

# Export functions for compatibility
get_current_user = get_current_user_from_session

__all__ = [
    'get_current_user_from_session',
    'get_current_user',
    'get_admin_user', 
    'require_csrf_token',
    'get_current_user_optional',
    'db'
]