from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.contact import ContactRequest
from api.models.responses import MessageResponse
from api.dependencies.auth import require_csrf_token
from api.dependencies.rate_limiting import rate_limit
from api.services.email_service import EmailService
from api.core.config import get_settings

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
        settings = get_settings()
        
        # Check if email is configured
        if not settings.ADMIN_EMAIL:
            print("❌ ADMIN_EMAIL not configured")
            raise HTTPException(status_code=500, detail="Email service not configured")
        
        if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
            print("❌ Email credentials not configured")
            raise HTTPException(status_code=500, detail="Email service not configured")
        
        subject = f"Contact Form: {contact_request.name}"
        body = f"""
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> {contact_request.name}</p>
        <p><strong>Email:</strong> {contact_request.email}</p>
        <p><strong>Phone:</strong> {contact_request.phone or 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>{contact_request.message}</p>
        """
        
        # Send contact email to admin
        email_sent = await email_service.send_email(settings.ADMIN_EMAIL, subject, body)
        
        if not email_sent:
            print("❌ Email service returned False")
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        # Send confirmation copy to user if requested
        if contact_request.send_confirmation:
            confirmation_subject = f"Message Received - {contact_request.name}"
            confirmation_body = f"""
            <h3>Thank you for contacting us!</h3>
            <p>Hello {contact_request.name},</p>
            <p>We have received your message and will get back to you within 24 hours.</p>
            
            <h4>Your message:</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p><strong>Subject:</strong> Contact Form Inquiry</p>
                <p><strong>Message:</strong></p>
                <p>{contact_request.message}</p>
            </div>
            
            <p>Best regards,<br>The E-Shop Team</p>
            """
            
            confirmation_sent = await email_service.send_email(
                contact_request.email, 
                confirmation_subject, 
                confirmation_body
            )
            
            if not confirmation_sent:
                print("⚠️ Failed to send confirmation email to user")
        
        print(f"✅ Contact email sent to {settings.ADMIN_EMAIL}")
        return MessageResponse(message="Message sent successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")