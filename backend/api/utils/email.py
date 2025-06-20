# Compatibility layer for utils/email.py
# Redirects to the new structured email service

from api.services.email_service import EmailService

# Create global email service instance
email_service = EmailService()

# Export functions for backward compatibility
async def send_email(to_email: str, subject: str, body: str) -> bool:
    return await email_service.send_email(to_email, subject, body)

async def send_verification_email(user_email: str, user_name: str, verification_url: str) -> bool:
    return await email_service.send_verification_email(user_email, user_name, verification_url)

async def send_order_confirmation_email(user_email: str, user_name: str, order_id: str, total_amount: float, items: list) -> bool:
    return await email_service.send_order_confirmation_email(user_email, user_name, order_id, total_amount, items)

async def send_admin_order_notification(order_id: str, user_email: str, user_name: str, total_amount: float, items: list) -> bool:
    return await email_service.send_admin_order_notification(order_id, user_email, user_name, total_amount, items)

async def send_password_reset_email(user_email: str, user_name: str, reset_url: str) -> bool:
    return await email_service.send_password_reset_email(user_email, user_name, reset_url)

async def send_contact_email(name: str, email: str, phone: str, message: str) -> bool:
    return await email_service.send_contact_email(name, email, phone, message)

# Keep the old function names for compatibility
send_2fa_email_code = email_service.send_2fa_email_code

__all__ = [
    'send_email',
    'send_verification_email', 
    'send_order_confirmation_email',
    'send_admin_order_notification',
    'send_password_reset_email',
    'send_contact_email',
    'send_2fa_email_code'
]