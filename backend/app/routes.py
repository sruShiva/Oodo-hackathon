from fastapi import APIRouter, Depends
from app.models import UserCreate, UserLogin, Token, UserResponse
from app.auth import register_user, authenticate_user, get_current_user

from typing import List, Optional
from app.models import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse
from app.auth import (
    create_question_service, 
    get_questions_service, 
    get_question_by_id_service,
    update_question_service,
    delete_question_service
)

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

# Question Management Routes
@router.post("/questions", response_model=QuestionResponse)
async def create_question(
    question: QuestionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new question (title, description, tags required)"""
    return create_question_service(question, current_user)

@router.get("/get-questions", response_model=QuestionListResponse)
async def get_questions(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    tags: Optional[str] = None 
):
    """Retrieve questions with filtering, pagination, and search"""
    
    tag_list = tags.split(",") if tags else None
    return get_questions_service(page, limit, search, tag_list)

@router.get("/get-specific-questions/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: str):
    """Get specific question details"""
    return get_question_by_id_service(question_id)

@router.put("/update-questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question: QuestionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update question (for question owner only)"""
    return update_question_service(question_id, question, current_user)

@router.delete("/delete-questions/{question_id}")
async def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete question (admin/owner permissions)"""
    return delete_question_service(question_id, current_user)