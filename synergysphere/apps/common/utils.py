"""
Common utilities for the SynergySphere project.
"""
import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def generate_otp(length=6):
    """
    Generate a random OTP of specified length.
    """
    return ''.join(random.choices(string.digits, k=length))


def send_email_otp(email, otp, user_name=None):
    """
    Send OTP via email.
    """
    subject = 'SynergySphere - Your OTP Code'
    context = {
        'otp': otp,
        'user_name': user_name or 'User',
        'expiry_minutes': settings.OTP_EXPIRY_MINUTES,
    }
    
    html_message = render_to_string('emails/otp_email.html', context)
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def send_sms_otp(phone_number, otp):
    """
    Send OTP via SMS (pluggable implementation).
    """
    provider = settings.SMS_PROVIDER
    
    if provider == 'console':
        print(f"SMS OTP to {phone_number}: {otp}")
        return True
    elif provider == 'twilio':
        return send_twilio_sms(phone_number, otp)
    elif provider == 'aws_sns':
        return send_aws_sns_sms(phone_number, otp)
    else:
        print(f"Unknown SMS provider: {provider}")
        return False


def send_twilio_sms(phone_number, otp):
    """
    Send SMS using Twilio.
    """
    try:
        from twilio.rest import Client
        
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"Your SynergySphere OTP code is: {otp}. Valid for {settings.OTP_EXPIRY_MINUTES} minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        return True
    except Exception as e:
        print(f"Error sending SMS via Twilio: {e}")
        return False


def send_aws_sns_sms(phone_number, otp):
    """
    Send SMS using AWS SNS.
    """
    try:
        import boto3
        
        sns = boto3.client('sns')
        response = sns.publish(
            PhoneNumber=phone_number,
            Message=f"Your SynergySphere OTP code is: {otp}. Valid for {settings.OTP_EXPIRY_MINUTES} minutes."
        )
        return True
    except Exception as e:
        print(f"Error sending SMS via AWS SNS: {e}")
        return False


def format_file_size(size_bytes):
    """
    Format file size in bytes to human readable format.
    """
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f}{size_names[i]}"


def validate_file_extension(filename, allowed_extensions):
    """
    Validate if file has allowed extension.
    """
    extension = filename.split('.')[-1].lower()
    return extension in allowed_extensions


def sanitize_filename(filename):
    """
    Sanitize filename by removing special characters.
    """
    import re
    # Remove special characters except dots, hyphens, and underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    return filename
