from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.contact import ContactRequest
from api.models.responses import MessageResponse
from api.dependencies.auth import require_csrf_token
from api.dependencies.rate_limiting import rate_limit

router = APIRouter()

@router.post("", response_model=MessageResponse)
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="contact")
async def submit_contact_form(
    contact_request: ContactRequest,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        # Contact form logic here
        return MessageResponse(message="Message sent successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))