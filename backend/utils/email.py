import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List
import os

# 🆕 Email configuration - Production ready with your credentials
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USER = os.getenv("EMAIL_USER", "email.testing.dph@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "khclismazjlasfco")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

# Production URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

async def send_email(to_email: str, subject: str, body: str):
    """Send email using Gmail SMTP - Production Version"""
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("⚠️ Email credentials not configured. Skipping email send.")
        print(f"EMAIL_USER: {EMAIL_USER}")
        print(f"EMAIL_PASSWORD: {'Set' if EMAIL_PASSWORD else 'Not set'}")
        return False
        
    try:
        print(f"📧 Attempting to send email to: {to_email}")
        print(f"📧 Using SMTP: {EMAIL_HOST}:{EMAIL_PORT}")
        print(f"📧 From: {EMAIL_USER}")
        
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_USER, to_email, text)
        server.quit()
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {e}")
        print("💡 Check your Gmail App Password is correct")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP error: {e}")
        return False
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False

async def send_order_confirmation_email(user_email: str, user_name: str, order_id: str, total_amount: float, items: List[dict]):
    """Send order confirmation email to customer"""
    
    subject = f"🎉 Order Confirmation - #{order_id} - Your Store"
    
    # Build items HTML
    items_html = ""
    for item in items:
        # Handle image URLs
        image_url = item['product']['image_url']
        if image_url.startswith('/'):
            image_url = f"{FRONTEND_URL}{image_url}"
        
        items_html += f"""
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">
                <div style="display: flex; align-items: center;">
                    <img src="{image_url}" alt="{item['product']['name']}" 
                         style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 5px;"
                         onerror="this.style.display='none'">
                    <span><strong>{item['product']['name']}</strong></span>
                </div>
            </td>
            <td style="padding: 10px; text-align: center;">{item['quantity']}</td>
            <td style="padding: 10px; text-align: right;">${item['product']['price']:.2f}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #28a745;">
                ${(item['product']['price'] * item['quantity']):.2f}
            </td>
        </tr>
        """
    
    tracking_url = f"{FRONTEND_URL}/orders"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #007bff, #28a745); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for your purchase, {user_name}!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff;">
                <h3 style="margin-top: 0; color: #007bff;">📋 Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Order Number:</td>
                        <td style="padding: 8px 0; color: #007bff; font-weight: bold;">#{order_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Order Date:</td>
                        <td style="padding: 8px 0;">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                        <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 18px;">${total_amount:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                        <td style="padding: 8px 0;">
                            <span style="background-color: #ffc107; color: #856404; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                                PENDING REVIEW
                            </span>
                        </td>
                    </tr>
                </table>
            </div>
            
            <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                🛍️ Items Ordered
            </h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
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
            
            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border: 1px solid #b3d9ff; margin: 30px 0;">
                <h3 style="color: #0056b3; margin-top: 0;">📦 What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Your order is currently <strong>pending review</strong> by our team</li>
                    <li style="margin-bottom: 8px;">You'll receive an email update once it's been processed and accepted</li>
                    <li style="margin-bottom: 8px;">You can track your order status in your account dashboard</li>
                    <li>Estimated processing time: <strong>1-2 business days</strong></li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{tracking_url}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    📱 Track Your Order
                </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; margin: 30px 0; border-radius: 8px; text-align: center;">
                <h4 style="color: #333; margin-top: 0;">Need Help?</h4>
                <p style="margin: 10px 0; color: #666;">
                    If you have any questions about your order, please contact our support team.
                </p>
                <p style="margin: 0;">
                    📧 Email: {EMAIL_USER}<br>
                    🌐 Website: {FRONTEND_URL}
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                    Thank you for choosing our store! 🙏<br>
                    <em>This is an automated confirmation email.</em>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(user_email, subject, body)

async def send_admin_order_notification(order_id: str, user_email: str, user_name: str, total_amount: float, items: List[dict]):
    """Send email notification to admin when new order is placed"""
    
    subject = f"🚨 NEW ORDER ALERT - #{order_id} - ${total_amount:.2f}"
    
    # Build items HTML
    items_html = ""
    for item in items:
        image_url = item['product']['image_url']
        if image_url.startswith('/'):
            image_url = f"{FRONTEND_URL}{image_url}"
            
        items_html += f"""
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">
                <img src="{image_url}" alt="{item['product']['name']}" 
                     style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px; border-radius: 4px; vertical-align: middle;"
                     onerror="this.style.display='none'">
                {item['product']['name']}
            </td>
            <td style="padding: 10px; text-align: center; font-weight: bold;">{item['quantity']}</td>
            <td style="padding: 10px; text-align: right;">${item['product']['price']:.2f}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #28a745;">
                ${(item['product']['price'] * item['quantity']):.2f}
            </td>
        </tr>
        """
    
    admin_panel_url = f"{FRONTEND_URL}/admin/orders"
    dashboard_url = f"{FRONTEND_URL}/admin/dashboard"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545, #fd7e14); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h2 style="margin: 0; font-size: 24px;">🚨 NEW ORDER ALERT</h2>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Immediate attention required!</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h3 style="margin-top: 0; color: #007bff;">📋 Order Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 140px;">Order ID:</td>
                            <td style="padding: 8px 0; color: #007bff; font-weight: bold;">#{order_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
                            <td style="padding: 8px 0;">{user_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                            <td style="padding: 8px 0;">{user_email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                            <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 20px;">${total_amount:.2f}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Order Time:</td>
                            <td style="padding: 8px 0;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                        </tr>
                    </table>
                </div>
                
                <h3 style="color: #333; margin-top: 30px;">🛍️ Order Items:</h3>
                <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
                    <thead>
                        <tr style="background-color: #007bff; color: white;">
                            <th style="padding: 15px; text-align: left;">Product</th>
                            <th style="padding: 15px; text-align: center;">Qty</th>
                            <th style="padding: 15px; text-align: right;">Price</th>
                            <th style="padding: 15px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 8px; border: 1px solid #b3d9ff;">
                    <h3 style="color: #0056b3; margin-top: 0;">⚡ Action Required</h3>
                    <p style="margin-bottom: 20px;">Please review and process this order immediately:</p>
                    <div style="text-align: center;">
                        <a href="{admin_panel_url}" 
                           style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
                            📋 View Order Details
                        </a>
                        <a href="{dashboard_url}" 
                           style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            📊 Go to Dashboard
                        </a>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                        This is an automated notification from your E-commerce platform.<br>
                        Backend: {BACKEND_URL} | Frontend: {FRONTEND_URL}<br>
                        Order received at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(ADMIN_EMAIL, subject, body)