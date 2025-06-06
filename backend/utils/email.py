import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List

# Email configuration - you can move this to a config file
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USER = "your-email@gmail.com"
EMAIL_PASSWORD = "your-app-password"
ADMIN_EMAIL = "admin@eshop.com"

async def send_email(to_email: str, subject: str, body: str):
    """Send email using Gmail SMTP"""
    try:
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
        
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Email sending failed: {e}")

async def send_admin_order_notification(order_id: str, user_email: str, user_name: str, total_amount: float, items: List[dict]):
    """Send email notification to admin when new order is placed"""
    
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
            <p style="font-size: 16px;"><strong>A new order has been placed and requires your immediate attention!</strong></p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #007bff;">
                <h3 style="margin-top: 0; color: #007bff;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Order ID:</td>
                        <td style="padding: 8px 0;">#{order_id}</td>
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
                        <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 18px;">${total_amount:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                        <td style="padding: 8px 0;"><span style="background-color: #ffc107; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px;">PENDING REVIEW</span></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Order Date:</td>
                        <td style="padding: 8px 0;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                </table>
            </div>
            
            <h3 style="color: #333; margin-top: 30px;">Items Ordered:</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
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
            
            <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 8px; border: 1px solid #b3d9ff;">
                <h3 style="color: #0056b3; margin-top: 0;">⚡ Action Required</h3>
                <p style="margin-bottom: 20px;">Please log in to the admin panel to review and process this order:</p>
                <div style="text-align: center;">
                    <a href="http://localhost:3000/admin/orders" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Review Order in Admin Panel
                    </a>
                </div>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                    Click the button above or navigate to the admin orders section to accept, process, or manage this order.
                </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                    This is an automated notification from your E-commerce platform.<br>
                    Please do not reply to this email. For support, contact your system administrator.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(ADMIN_EMAIL, subject, body)

async def send_order_confirmation_email(user_email: str, user_name: str, order_id: str, total_amount: float, items: List[dict]):
    """Send order confirmation email to customer"""
    
    subject = f"Order Confirmation - #{order_id}"
    
    items_html = ""
    for item in items:
        items_html += f"<li style='margin-bottom: 8px;'>{item['product']['name']} - Quantity: {item['quantity']} - ${item['product']['price']:.2f}</li>"
    
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">Order Confirmation</h2>
            <p>Dear {user_name},</p>
            <p>Thank you for your order! We've received your order and it's being reviewed by our team.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <p><strong>Order ID:</strong> #{order_id}</p>
                <p><strong>Total Amount:</strong> ${total_amount:.2f}</p>
                <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">Pending Review</span></p>
            </div>
            
            <h3>Items Ordered:</h3>
            <ul style="list-style-type: none; padding: 0;">
                {items_html}
            </ul>
            
            <div style="background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p><strong>What's Next?</strong></p>
                <p>Your order is currently pending review by our team. You'll receive an email update once it's been processed and accepted.</p>
            </div>
            
            <p>Thank you for shopping with us!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                This is an automated confirmation from E-Shop.<br>
                If you have any questions, please contact our support team.
            </p>
        </div>
    </body>
    </html>
    """
    
    await send_email(user_email, subject, body)