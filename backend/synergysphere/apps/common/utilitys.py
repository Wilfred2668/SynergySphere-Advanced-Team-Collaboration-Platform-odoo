"""
Common utility functions for the SynergySphere project.
"""
import random
import string
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


def generate_otp(length=6):
    """Generate a random OTP code."""
    return ''.join(random.choices(string.digits, k=length))


def send_email_otp(email, otp_code, user_name=None):
    """
    Send OTP via email.
    """
    try:
        context = {
            'otp': otp_code,
            'user_name': user_name or 'User',
            'expiry_minutes': settings.OTP_EXPIRY_MINUTES,
        }
        
        html_message = render_to_string('emails/otp_email.html', context)
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject='SynergySphere - Verification Code',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email OTP: {e}")
        return False


def send_sms_otp(phone_number, otp_code):
    """
    Send OTP via SMS (pluggable gateway).
    """
    provider = settings.SMS_PROVIDER
    
    if provider == 'console':
        print(f"SMS OTP for {phone_number}: {otp_code}")
        return True
    elif provider == 'twilio':
        return send_twilio_sms(phone_number, otp_code)
    elif provider == 'aws_sns':
        return send_aws_sns_sms(phone_number, otp_code)
    else:
        print(f"Unknown SMS provider: {provider}")
        return False


def send_twilio_sms(phone_number, otp_code):
    """
    Send SMS using Twilio.
    """
    try:
        from twilio.rest import Client
        
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        
        message = client.messages.create(
            body=f"Your SynergySphere verification code is: {otp_code}",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        return True
    except Exception as e:
        print(f"Error sending Twilio SMS: {e}")
        return False


def send_aws_sns_sms(phone_number, otp_code):
    """
    Send SMS using AWS SNS.
    """
    try:
        import boto3
        
        sns = boto3.client('sns')
        
        response = sns.publish(
            PhoneNumber=phone_number,
            Message=f"Your SynergySphere verification code is: {otp_code}"
        )
        
        return True
    except Exception as e:
        print(f"Error sending AWS SNS SMS: {e}")
        return False


def format_file_size(size_bytes):
    """
    Format file size in human readable format.
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def get_client_ip(request):
    """
    Get client IP address from request.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent_info(request):
    """
    Extract device and browser info from user agent.
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Simple device detection
    device_type = 'desktop'
    if 'Mobile' in user_agent:
        device_type = 'mobile'
    elif 'Tablet' in user_agent:
        device_type = 'tablet'
    
    return {
        'user_agent': user_agent,
        'device_type': device_type
    }
