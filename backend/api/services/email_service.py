import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List
import os

from api.core.config import get_settings

settings = get_settings()

class EmailService:
    def __init__(self):
        self.email_host = settings.EMAIL_HOST
        self.email_port = settings.EMAIL_PORT
        self.email_user = settings.EMAIL_USER
        self.email_password = settings.EMAIL_PASSWORD
        self.admin_email = settings.ADMIN_EMAIL
    
    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        if not self.email_user or not self.email_password:
            print("Email credentials not configured")
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.email_host, self.email_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            text = msg.as_string()
            server.sendmail(self.email_user, to_email, text)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Email sending failed: {e}")
            return False
    
    async def send_verification_email(self, user_email: str, user_name: str, verification_url: str) -> bool:
        subject = "Verify Your Email"
        body = f"""
        <html>
        <body>
            <h2>Email Verification</h2>
            <p>Hello {user_name},</p>
            <p>Please click the link below to verify your email:</p>
            <a href="{verification_url}">Verify Email</a>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, body)
    
    async def send_order_confirmation_email(self, user_email: str, user_name: str, order_id: str, total_amount: float, items: List[dict]) -> bool:
        subject = f"Order Confirmation - #{order_id}"
        body = f"""
        <html>
        <body>
            <h2>Order Confirmed!</h2>
            <p>Hello {user_name},</p>
            <p>Your order #{order_id} has been confirmed.</p>
            <p>Total: ${total_amount:.2f}</p>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, body)
    
    async def send_admin_order_notification(self, order_id: str, user_email: str, user_name: str, total_amount: float, items: List[dict]) -> bool:
        subject = f"New Order - #{order_id}"
        body = f"""
        <html>
        <body>
            <h2>New Order Alert</h2>
            <p>Order ID: #{order_id}</p>
            <p>Customer: {user_name} ({user_email})</p>
            <p>Total: ${total_amount:.2f}</p>
        </body>
        </html>
        """
        return await self.send_email(self.admin_email, subject, body)
    
async def send_password_reset_email(self, user_email: str, user_name: str, reset_url: str) -> bool:
    subject = f"🔐 Reset Your Password - {self.email_user}"
    body = f"""
    <html><body>
        <h2>Password Reset Request</h2>
        <p>Hello {user_name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="{reset_url}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
    </body></html>
    """
    return await self.send_email(user_email, subject, body)