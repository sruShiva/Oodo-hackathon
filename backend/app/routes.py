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

from app.models import AnswerCreate, AnswerUpdate, AnswerResponse, AnswerListResponse
from app.auth import (
    create_answer_service,
    get_answers_service,
    update_answer_service,
    delete_answer_service,
    accept_answer_service
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

@router.get("/questions", response_model=QuestionListResponse)
async def get_questions(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    tags: Optional[str] = None  # Comma-separated tags
):
    """Retrieve questions with filtering, pagination, and search"""
    # Parse tags if provided
    tag_list = tags.split(",") if tags else None
    return get_questions_service(page, limit, search, tag_list)

@router.get("/questions/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: str):
    """Get specific question details"""
    return get_question_by_id_service(question_id)

@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: str,
    question: QuestionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update question (for question owner only)"""
    return update_question_service(question_id, question, current_user)

@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete question (admin/owner permissions)"""
    return delete_question_service(question_id, current_user)


# Answer Management Routes
@router.post("/questions/{question_id}/answers", response_model=AnswerResponse)
async def create_answer(
    question_id: str,
    answer: AnswerCreate,
    current_user: dict = Depends(get_current_user)
):
    """Post an answer to a specific question"""
    return create_answer_service(question_id, answer, current_user)

@router.get("/questions/{question_id}/answers", response_model=AnswerListResponse)
async def get_answers(
    question_id: str,
    sort: str = "newest"  # newest, oldest, votes
):
    """Get all answers for a question"""
    return get_answers_service(question_id, sort)

@router.put("/answers/{answer_id}", response_model=AnswerResponse)
async def update_answer(
    answer_id: str,
    answer: AnswerUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an answer (author only)"""
    return update_answer_service(answer_id, answer, current_user)

@router.delete("/answers/{answer_id}")
async def delete_answer(
    answer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an answer (author/admin only)"""
    return delete_answer_service(answer_id, current_user)

@router.post("/answers/{answer_id}/accept", response_model=AnswerResponse)
async def accept_answer(
    answer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark answer as accepted (question owner only)"""
    return accept_answer_service(answer_id, current_user)