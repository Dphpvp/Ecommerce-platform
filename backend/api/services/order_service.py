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
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">✉️ Email Verification</h1>
            </div>
            
            <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p>Hello {user_name},</p>
                <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 2rem 0;">
                    <a href="{verification_url}" 
                       style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #007bff;">{verification_url}</p>
                
                <p><strong>This link expires in 24 hours.</strong></p>
                <p>If you didn't create an account, please ignore this email.</p>
                
                <hr style="margin: 2rem 0;">
                <p style="color: #666; font-size: 0.9rem; text-align: center;">
                    This is an automated message from E-Shop.
                </p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, body)
    
    async def send_2fa_email_code(self, email: str, code: str, user_name: str = "User") -> bool:
        """Send 2FA code via email"""
        subject = "🔐 Your Login Code"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">🔐 Security Code</h1>
            </div>
            
            <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p>Hello {user_name},</p>
                <p>Your login verification code is:</p>
                
                <div style="background: #f8f9fa; padding: 2rem; margin: 1.5rem 0; border-radius: 8px; text-align: center; border: 2px solid #007bff;">
                    <span style="font-size: 2rem; font-weight: bold; color: #007bff; letter-spacing: 0.5rem;">{code}</span>
                </div>
                
                <p><strong>This code expires in 5 minutes.</strong></p>
                <p>If you didn't request this code, please ignore this email.</p>
                
                <hr style="margin: 2rem 0;">
                <p style="color: #666; font-size: 0.9rem; text-align: center;">
                    This is an automated security message.
                </p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(email, subject, body)
    
    async def send_order_confirmation_email(self, user_email: str, user_name: str, order_id: str, total_amount: float, items: List[dict]) -> bool:
        subject = f"Order Confirmation - #{order_id}"
        
        items_html = ""
        for item in items:
            items_html += f"""
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">{item['product']['name']}</td>
                <td style="padding: 10px; text-align: center;">{item['quantity']}</td>
                <td style="padding: 10px; text-align: right;">${item['product']['price']:.2f}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${(item['product']['price'] * item['quantity']):.2f}</td>
            </tr>
            """
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">🎉 Order Confirmed!</h1>
            </div>
            
            <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p>Hello {user_name},</p>
                <p>Thank you for your order! We've received it and it's being processed.</p>
                
                <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #28a745;">Order Details</h3>
                    <p><strong>Order ID:</strong> #{order_id}</p>
                    <p><strong>Total Amount:</strong> <span style="color: #28a745; font-size: 1.2em; font-weight: bold;">${total_amount:.2f}</span></p>
                    <p><strong>Status:</strong> <span style="background-color: #ffc107; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px;">PENDING</span></p>
                </div>
                
                <h3>Items Ordered:</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background-color: #28a745; color: white;">
                            <th style="padding: 15px; text-align: left;">Product</th>
                            <th style="padding: 15px; text-align: center;">Quantity</th>
                            <th style="padding: 15px; text-align: right;">Unit Price</th>
                            <th style="padding: 15px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p><strong>What's Next?</strong></p>
                    <p>Your order is being processed and you'll receive updates via email. Thank you for shopping with us!</p>
                </div>
                
                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    This is an automated confirmation. If you have questions, contact support.
                </p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, body)
    
    async def send_admin_order_notification(self, order_id: str, user_email: str, user_name: str, total_amount: float, items: List[dict]) -> bool:
        subject = f"🚨 New Order Alert - #{order_id}"
        
        items_html = ""
        for item in items:
            items_html += f"""
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">{item['product']['name']}</td>
                <td style="padding: 10px; text-align: center;">{item['quantity']}</td>
                <td style="padding: 10px; text-align: right;">${item['product']['price']:.2f}</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">${(item['product']['price'] * item['quantity']):.2f}</td>
            </tr>
            """
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
                    🚨 New Order Alert
                </h2>
                <p style="font-size: 16px;"><strong>A new order requires your attention!</strong></p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h3 style="margin-top: 0; color: #007bff;">Order Details</h3>
                    <p><strong>Order ID:</strong> #{order_id}</p>
                    <p><strong>Customer:</strong> {user_name} ({user_email})</p>
                    <p><strong>Total:</strong> <span style="color: #28a745; font-weight: bold; font-size: 18px;">${total_amount:.2f}</span></p>
                    <p><strong>Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                
                <h3>Items Ordered:</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background-color: #007bff; color: white;">
                            <th style="padding: 15px; text-align: left;">Product</th>
                            <th style="padding: 15px; text-align: center;">Quantity</th>
                            <th style="padding: 15px; text-align: right;">Unit Price</th>
                            <th style="padding: 15px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 8px;">
                    <h3 style="color: #0056b3; margin-top: 0;">⚡ Action Required</h3>
                    <p>Please log in to the admin panel to process this order.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(self.admin_email, subject, body)

    async def send_password_reset_email(self, user_email: str, user_name: str, reset_url: str) -> bool:
        subject = "🔐 Reset Your Password"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">🔐 Password Reset</h1>
            </div>
            
            <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p>Hello {user_name},</p>
                <p>You requested to reset your password. Click the button below to set a new password:</p>
                
                <div style="text-align: center; margin: 2rem 0;">
                    <a href="{reset_url}" 
                       style="background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link:</p>
                <p style="word-break: break-all; color: #dc3545;">{reset_url}</p>
                
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you didn't request this reset, please ignore this email.</p>
                
                <hr style="margin: 2rem 0;">
                <p style="color: #666; font-size: 0.9rem; text-align: center;">
                    This is an automated message from E-Shop.
                </p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(user_email, subject, body)

    async def send_contact_email(self, name: str, email: str, phone: str, message: str) -> bool:
        subject = f"Contact Form: {name}"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">New Contact Form Submission</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Phone:</strong> {phone or 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    {message}
                </div>
            </div>
            <p style="color: #666; font-size: 12px;">
                Sent from contact form at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            </p>
        </body>
        </html>
        """
        return await self.send_email(self.admin_email, subject, body)

    async def send_contact_confirmation_email(self, name: str, email: str, phone: str, message: str) -> bool:
        """Send confirmation email to user who submitted contact form"""
        subject = "✅ We received your message - Vergishop"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #D4AF37, #B8941F); color: white; padding: 2rem; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">✅ Message Received</h1>
            </div>
            
            <div style="background: white; padding: 2rem; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <p>Hello {name},</p>
                <p>Thank you for contacting us! We have received your message and will respond within 24 hours.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                    <h3 style="margin-top: 0; color: #D4AF37;">Your Message Details</h3>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Phone:</strong> {phone or 'Not provided'}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; border: 1px solid #ddd;">
                        {message}
                    </div>
                </div>
                
                <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p><strong>What's Next?</strong></p>
                    <p>Our team will review your message and get back to you soon. For urgent matters, please call us directly at +44 (0) 20 7123 4567.</p>
                </div>
                
                <hr style="margin: 2rem 0;">
                <p style="color: #666; font-size: 0.9rem; text-align: center;">
                    This is an automated confirmation from Vergishop.<br>
                    Sent on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}
                </p>
            </div>
        </body>
        </html>
        """
        return await self.send_email(email, subject, body)