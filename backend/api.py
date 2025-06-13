from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")  # Your email
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")  # Your app password
TO_EMAIL = os.getenv("TO_EMAIL", EMAIL_ADDRESS)  # Where to receive messages

@app.route('/api/contact', methods=['POST'])
def send_contact_email():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['name', 'email', 'message']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        name = data['name']
        email = data['email']
        phone = data.get('phone', 'Not provided')
        message = data['message']
        
        # Create email
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = TO_EMAIL
        msg['Subject'] = f"New Contact Form Message from {name}"
        
        # Email body
        body = f"""
        New contact form submission:
        
        Name: {name}
        Email: {email}
        Phone: {phone}
        
        Message:
        {message}
        
        ---
        This message was sent from your website contact form.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_ADDRESS, TO_EMAIL, text)
        server.quit()
        
        return jsonify({'message': 'Email sent successfully'}), 200
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return jsonify({'error': 'Failed to send email'}), 500

if __name__ == '__main__':
    app.run(debug=True)