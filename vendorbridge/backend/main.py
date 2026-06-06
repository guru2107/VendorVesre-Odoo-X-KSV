import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base

logger = logging.getLogger(__name__)

app = FastAPI(title="VendorBridge API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Seed default admin user
    from .services.auth_service import seed_admin
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_admin(db)
    finally:
        db.close()


# Mount uploads AFTER startup to avoid directory issues
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health():
    return {"status": "ok", "db": "postgresql"}


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Validation error", "details": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )


# Include all routers
from .routers import auth, dashboard, vendors, rfqs, quotations, approvals, purchase_orders, invoices, activity_logs, reports, users

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(vendors.router)
app.include_router(rfqs.router)
app.include_router(quotations.router)
app.include_router(approvals.router)
app.include_router(purchase_orders.router)
app.include_router(invoices.router)
app.include_router(activity_logs.router)
app.include_router(reports.router)
