from pydantic_settings import BaseSettings
from pydantic import ConfigDict
import os


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@vendorbridge.com"
    MAIL_PORT: int = 2525
    MAIL_SERVER: str = "sandbox.smtp.mailtrap.io"
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False

    UPLOAD_DIR: str = "uploads"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = ConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        extra="ignore",
    )


settings = Settings()
