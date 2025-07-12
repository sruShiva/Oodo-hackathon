from fastapi import APIRouter, Depends
from app.models import UserCreate, UserLogin, Token, UserResponse
from app.auth import register_user, authenticate_user, get_current_user

router = APIRouter()

# Authentication Routes
@router.post("/auth/register")
async def register(user: UserCreate):
    return register_user(user)

@router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    return authenticate_user(user)

@router.post("/auth/logout")
async def logout():
    return {"message": "Successfully logged out"}

@router.get("/users/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


