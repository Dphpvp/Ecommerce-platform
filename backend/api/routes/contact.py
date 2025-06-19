from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.contact import ContactRequest
from api.models.responses import MessageResponse
from api.dependencies.auth import require_csrf_token
from api.dependencies.rate_limiting import rate_limit
from api.services.email_service import EmailService

router = APIRouter()
email_service = EmailService()

@router.post("", response_model=MessageResponse)
@rate_limit(max_attempts=3, window_minutes=60, endpoint_name="contact")
async def submit_contact_form(
    contact_request: ContactRequest,
    request: Request,
    csrf_valid: bool = Depends(require_csrf_token)
):
    try:
        # Send contact email
        from api.core.config import get_settings
        settings = get_settings()
        
        subject = f"Contact Form: {contact_request.name}"
        body = f"""
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> {contact_request.name}</p>
        <p><strong>Email:</strong> {contact_request.email}</p>
        <p><strong>Phone:</strong> {contact_request.phone or 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>{contact_request.message}</p>
        """
        
        await email_service.send_email(settings.ADMIN_EMAIL, subject, body)
        return MessageResponse(message="Message sent successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send message")