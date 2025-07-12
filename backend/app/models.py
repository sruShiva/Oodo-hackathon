from pydantic import BaseModel, EmailStr
from datetime import datetime

from typing import Optional, List

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

# Question models
class QuestionCreate(BaseModel):
    title: str
    description: str
    tags: List[str]

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

class QuestionResponse(BaseModel):
    id: str
    title: str
    description: str
    tags: List[str]
    author_id: str
    author_username: str
    created_at: datetime
    updated_at: datetime
    vote_count: int = 0
    answer_count: int = 0
    accepted_answer_id: Optional[str] = None
    view_count: int = 0

class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int
    page: int
    limit: int
