from pydantic import BaseModel, EmailStr
from datetime import datetime

# User Models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime
    is_verified: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse