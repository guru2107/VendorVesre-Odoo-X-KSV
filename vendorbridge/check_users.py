from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, email, name, role, is_active FROM users"))
        users = result.fetchall()
        print("Users in database:")
        for user in users:
            print(f"  ID: {user[0]}, Email: {user[1]}, Name: {user[2]}, Role: {user[3]}, Active: {user[4]}")
        if not users:
            print("  No users found")
except Exception as e:
    print("Error:", e)
