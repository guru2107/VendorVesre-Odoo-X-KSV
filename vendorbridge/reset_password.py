from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from passlib.context import CryptContext
import os

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
new_password = "Admin@123"
hashed_password = pwd_context.hash(new_password)

try:
    with engine.connect() as conn:
        # Update password for admin@test.com
        result = conn.execute(text("UPDATE users SET hashed_password = :pwd WHERE email = 'admin@test.com'"), {"pwd": hashed_password})
        conn.commit()
        print(f"Password updated for admin@test.com")
        print(f"New password: {new_password}")
except Exception as e:
    print("Error:", e)
