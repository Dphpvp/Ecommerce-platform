from fastapi import APIRouter, HTTPException, Depends, Request
from api.models.contact import ContactRequest
from api.models.responses import MessageResponse
from api.dependencies.auth import require_csrf_token
from api.dependencies.rate_limiting import rate_limit
from api.services.email_service import EmailService
from api.core.config import get_settings
import datetime

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
        
        subject = f"New Consultation Request - {contact_request.name}"
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Contact Form Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">VERGISHOP</h1>
                    <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">BESPOKE TAILORING</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 30px 0; font-size: 24px; font-weight: 400;">New Consultation Request</h2>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #d4af37; padding: 25px; margin-bottom: 30px;">
                        <h3 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px; font-weight: 500;">Client Information</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 500; width: 100px;">Name:</td>
                                <td style="padding: 8px 0; color: #1a1a1a;">{contact_request.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 500;">Email:</td>
                                <td style="padding: 8px 0; color: #1a1a1a;">{contact_request.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 500;">Phone:</td>
                                <td style="padding: 8px 0; color: #1a1a1a;">{contact_request.phone or 'Not provided'}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px; font-weight: 500;">Message</h3>
                        <div style="background-color: #ffffff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; line-height: 1.6; color: #333;">
                            {contact_request.message}
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                    <p style="color: #cccccc; margin: 0; font-size: 12px; line-height: 1.5;">
                        Received on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br>
                        <span style="color: #d4af37;">VERGISHOP Atelier Management System</span>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send contact email to admin
        email_sent = await email_service.send_email(settings.ADMIN_EMAIL, subject, body)
        
        if not email_sent:
            print("❌ Email service returned False")
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        # Send confirmation copy to user if requested
        if contact_request.send_confirmation:
            confirmation_subject = f"Thank you for your consultation request"
            confirmation_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Consultation Request Received</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">VERGISHOP</h1>
                        <p style="color: #cccccc; margin: 10px 0 0 0; font-size: 14px; letter-spacing: 1px;">BESPOKE TAILORING</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">Thank You, {contact_request.name}</h2>
                        
                        <p style="color: #333; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
                            We have received your consultation request and appreciate your interest in our bespoke tailoring services.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e76e 100%); padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
                            <h3 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 18px; font-weight: 500;">What's Next?</h3>
                            <p style="color: #333; margin: 0; line-height: 1.5;">Our master tailors will review your request and contact you within <strong>24 hours</strong> to schedule your personal consultation.</p>
                        </div>
                        
                        <div style="background-color: #f8f9fa; border-left: 4px solid #d4af37; padding: 25px; margin: 30px 0;">
                            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">Your Message:</h3>
                            <div style="color: #555; line-height: 1.6; font-style: italic;">
                                "{contact_request.message}"
                            </div>
                        </div>
                        
                        <div style="border-top: 1px solid #e0e0e0; padding-top: 25px; margin-top: 30px;">
                            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">Contact Information</h3>
                            <p style="color: #666; margin: 5px 0; line-height: 1.5;">
                                📍 123 Savile Row, Mayfair District, London W1S 3PB<br>
                                📞 +44 (0) 20 7123 4567<br>
                                📧 appointments@vergishop.com
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                        <p style="color: #cccccc; margin: 0 0 10px 0; font-size: 14px;">
                            <strong style="color: #d4af37;">VERGISHOP</strong> - Where tradition meets innovation
                        </p>
                        <p style="color: #999; margin: 0; font-size: 12px;">
                            This is an automated confirmation. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
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