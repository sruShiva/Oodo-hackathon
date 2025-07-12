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


#answer models
class AnswerCreate(BaseModel):
    content: str

class AnswerUpdate(BaseModel):
    content: Optional[str] = None

class AnswerResponse(BaseModel):
    id: str
    content: str
    question_id: str
    author_id: str
    author_username: str
    created_at: datetime
    updated_at: datetime
    vote_count: int = 0
    is_accepted: bool = False

class AnswerListResponse(BaseModel):
    answers: List[AnswerResponse]
    total: int
    question_id: str


#voting models
class VoteCreate(BaseModel):
    vote_type: str  # "upvote" or "downvote"

class VoteResponse(BaseModel):
    id: str
    answer_id: str
    user_id: str
    vote_type: str
    created_at: datetime

class VoteResult(BaseModel):
    message: str
    answer_id: str
    new_vote_count: int
    user_vote: Optional[str] = None  # Current user's vote type


#tag models
class TagCreate(BaseModel):
    name: str

class TagResponse(BaseModel):
    name: str
    usage_count: int = 0

class TagListResponse(BaseModel):
    tags: List[TagResponse]
    total: int


# admin models
class AdminBanUser(BaseModel):
    user_id: str
    reason: str

class AdminMessage(BaseModel):
    message: str
    type: str = "announcement"  # announcement, maintenance, update

class AdminBanResponse(BaseModel):
    message: str
    username: str
    reason: str

class AdminMessageResponse(BaseModel):
    message: str
    sent_to_users: int

class AdminReports(BaseModel):
    total_users: int
    total_questions: int
    total_answers: int
    banned_users: int

#notification models
class NotificationResponse(BaseModel):
    id: str
    type: str  # "new_answer", "answer_comment", "mention"
    message: str
    is_read: bool
    created_at: datetime
    related_id: Optional[str] = None

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int


#genai models
class AIQuestionRequest(BaseModel):
    question: str

class AIAnswerResponse(BaseModel):
    answer: str
    model_used: str = "gemini-2.0-flash-exp"
    response_time: Optional[float] = None