from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        print("PostgreSQL connected:", result.fetchone()[0])
except Exception as e:
    print("Connection failed:", e)
