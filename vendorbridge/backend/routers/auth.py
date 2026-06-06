from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.user import UserLogin, UserOut, Token
from ..services.auth_service import authenticate_user, create_access_token
from ..dependencies.auth import get_current_user
from ..models.user import User
from ..utils.logger import log_activity

router = APIRouter(prefix="/auth", tags=["auth"])


@router.options("/login")
def login_options():
    return {"message": "OK"}

@router.post("/login", response_model=Token)
def login(body: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    token = create_access_token({"sub": user.email})
    log_activity(db, user.id, "LOGIN", "user", user.id, f"User {user.email} logged in",
                 request.client.host if request else None)
    db.commit()
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

