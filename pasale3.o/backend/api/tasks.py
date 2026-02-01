from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_otp_email(email, otp):
    try:
        subject = 'Your OTP Code'
        message = f'Your OTP code is: {otp}'
        email_from = settings.EMAIL_HOST_USER
        recipient_list = [email]

        send_mail(subject, message, email_from,
                  recipient_list, fail_silently=False)
        logger.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False
