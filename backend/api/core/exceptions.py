class APIException(Exception):
    """Base API exception."""
    
    def __init__(self, detail: str, status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)

class AuthenticationError(APIException):
    """Authentication related errors."""
    
    def __init__(self, detail: str):
        super().__init__(detail, 401)

class ValidationError(APIException):
    """Validation related errors."""
    
    def __init__(self, detail: str):
        super().__init__(detail, 400)

class PermissionError(APIException):
    """Permission related errors."""
    
    def __init__(self, detail: str):
        super().__init__(detail, 403)

class NotFoundError(APIException):
    """Resource not found errors."""
    
    def __init__(self, detail: str):
        super().__init__(detail, 404)

class APIException(Exception):
    def __init__(self, detail: str, status_code: int = 500):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)

class AuthenticationError(APIException):
    def __init__(self, detail: str):
        super().__init__(detail, 401)

class ValidationError(APIException):
    def __init__(self, detail: str):
        super().__init__(detail, 400)

class PermissionError(APIException):
    def __init__(self, detail: str):
        super().__init__(detail, 403)

class NotFoundError(APIException):
    def __init__(self, detail: str):
        super().__init__(detail, 404)
