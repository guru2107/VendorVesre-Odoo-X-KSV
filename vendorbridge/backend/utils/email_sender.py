import logging
import os
import tempfile

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from ..config import settings

logger = logging.getLogger(__name__)

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_TLS,
    MAIL_SSL_TLS=settings.MAIL_SSL,
    USE_CREDENTIALS=True,
)

fastmail = FastMail(mail_config)


async def send_invoice_email(invoice, vendor_email: str, vendor_name: str, pdf_bytes: bytes):
    filename = f"{invoice.invoice_number}.pdf"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        message = MessageSchema(
            subject=f"Invoice {invoice.invoice_number} from VendorBridge",
            recipients=[vendor_email],
            body=(
                f"Dear {vendor_name},\n\n"
                f"Please find attached Invoice {invoice.invoice_number}.\n\n"
                f"Total Amount: Rs {float(invoice.total):,.2f}\n"
                f"Due Date: Within 30 days\n\n"
                f"Regards,\nVendorBridge Team"
            ),
            subtype=MessageType.plain,
            attachments=[tmp_path],
        )
        await fastmail.send_message(message)
    except Exception as exc:
        logger.error("Failed to send invoice email to %s: %s", vendor_email, exc)
        raise
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
