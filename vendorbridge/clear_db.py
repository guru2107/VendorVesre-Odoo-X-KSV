from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

try:
    with engine.connect() as conn:
        # Delete in order of dependencies (child tables first)
        tables = [
            "activity_logs",
            "invoices",
            "purchase_orders",
            "approvals",
            "quotations",
            "rfqs",
            "vendors",
            "users"
        ]
        
        total_deleted = 0
        for table in tables:
            result = conn.execute(text(f"DELETE FROM {table}"))
            total_deleted += result.rowcount
            print(f"Deleted {result.rowcount} rows from {table}")
        
        conn.commit()
        print(f"\nTotal deleted: {total_deleted} rows")
        print("Database cleared successfully")
except Exception as e:
    print("Error:", e)
