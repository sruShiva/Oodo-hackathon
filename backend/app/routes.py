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

from app.models import VoteCreate, VoteResult
from app.auth import vote_answer_service, remove_vote_service

from app.models import TagCreate, TagResponse, TagListResponse
from app.auth import get_tags_service, create_tag_service

from app.models import AdminBanUser, AdminMessage, AdminBanResponse, AdminMessageResponse, AdminReports
from app.auth import (
    admin_ban_user_service,
    admin_send_message_service,
    admin_reject_content_service,
    admin_get_reports_service
)

# Add these imports for notification routes
from app.models import NotificationResponse, NotificationListResponse
from app.auth import (
    get_user_notifications_service,
    mark_notification_read_service,
    mark_all_notifications_read_service
)

from app.models import AIQuestionRequest, AIAnswerResponse
from app.auth import get_ai_answer_service


router = APIRouter()

# authentication routes
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


# question management Routes
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


# answer management routes
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


# voting routes
@router.post("/answers/{answer_id}/vote", response_model=VoteResult)
async def vote_answer(
    answer_id: str,
    vote: VoteCreate,
    current_user: dict = Depends(get_current_user)
):
    """Upvote or downvote an answer"""
    return vote_answer_service(answer_id, vote, current_user)

@router.delete("/answers/{answer_id}/vote", response_model=VoteResult)
async def remove_vote(
    answer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove vote from an answer"""
    return remove_vote_service(answer_id, current_user)


# tag management routes
@router.get("/tags", response_model=TagListResponse)
async def get_tags(
    search: Optional[str] = None,
    limit: int = 100
):
    """Get available tags for multi-select dropdown"""
    return get_tags_service(search, limit)

@router.post("/tags", response_model=TagResponse)
async def create_tag(
    tag: TagCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new tag (returns immediately, will be saved when used in question)"""
    return create_tag_service(tag, current_user)

#admin routes
@router.post("/admin/ban-user")
async def admin_ban_user(
    ban_request: AdminBanUser,
    current_user: dict = Depends(get_current_user)
):
    """Ban users who violate platform policies"""
    return admin_ban_user_service(ban_request, current_user)

@router.post("/admin/messages")
async def admin_send_message(
    message: AdminMessage,
    current_user: dict = Depends(get_current_user)
):
    """Send platform-wide messages"""
    return admin_send_message_service(message, current_user)

@router.delete("/admin/moderate/{content_type}/{content_id}")
async def admin_reject_content(
    content_type: str,
    content_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject inappropriate content (removes it)"""
    return admin_reject_content_service(content_type, content_id, current_user)

@router.get("/admin/reports")
async def admin_get_reports(
    current_user: dict = Depends(get_current_user)
):
    """Download basic activity reports"""
    return admin_get_reports_service(current_user)



# notification routes
@router.get("/notifications", response_model=NotificationListResponse)
async def get_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Fetch user notifications for bell dropdown"""
    return get_user_notifications_service(current_user)

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    return mark_notification_read_service(notification_id, current_user)

@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    return mark_all_notifications_read_service(current_user)

#ai route
@router.post("/questions/answers_ai", response_model=AIAnswerResponse)
async def get_ai_answer(
    question_request: AIQuestionRequest
):
    """Get AI-generated answer using Gemini 2.0 Flash"""
    return get_ai_answer_service(question_request)