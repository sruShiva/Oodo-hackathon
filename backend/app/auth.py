import uuid
from datetime import datetime
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from tinydb import Query
from app.database import users_table
from app.utils import verify_password, get_password_hash, create_access_token, verify_token
from app.models import UserCreate, UserLogin, UserResponse, Token

from typing import List, Optional
from app.database import questions_table
from app.models import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse

import re

security = HTTPBearer()

def register_user(user_data: UserCreate):
    User = Query()
    
    # Check if user already exists
    existing_user = users_table.search(User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "id": str(uuid.uuid4()),
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hashed_password,
        "created_at": datetime.utcnow().isoformat(),
        "is_verified": True,
        "role": "user"
    }
    
    users_table.insert(new_user)
    return {"message": "User registered successfully", "user_id": new_user["id"]}

def authenticate_user(user_data: UserLogin):
    User = Query()
    user = users_table.search(User.email == user_data.email)
    
    if not user or not verify_password(user_data.password, user[0]["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user = user[0]
    access_token = create_access_token(data={"sub": user["email"]})
    user["access_token"] = access_token
    users_table.update(user, Query().email == user["email"])
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user)
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials"
    )
    
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    email = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    User = Query()
    user = users_table.search(User.email == email)
    if not user:
        raise credentials_exception
    
    return user[0]

def create_question_service(question_data: QuestionCreate, current_user: dict):
    """Create a new question"""
    new_question = {
        "id": str(uuid.uuid4()),
        "title": question_data.title,
        "description": question_data.description,
        "tags": question_data.tags,
        "author_id": current_user["id"],
        "author_username": current_user["username"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "vote_count": 0,
        "answer_count": 0,
        "accepted_answer_id": None,
        "view_count": 0
    }
    
    questions_table.insert(new_question)
    return QuestionResponse(**new_question)

def get_questions_service(page: int = 1, limit: int = 10, search: Optional[str] = None, tags: Optional[List[str]] = None):
    """Get all questions with pagination and filtering"""
    Question = Query()
    
    # Build query conditions
    conditions = []
    
    if search:
        conditions.append(
            (Question.title.matches(f'.*{search}.*', flags=re.IGNORECASE)) |
            (Question.description.matches(f'.*{search}.*', flags=re.IGNORECASE))
        )
    
    if tags:
        for tag in tags:
            conditions.append(Question.tags.any([tag]))
    
    # Execute query
    if conditions:
        query_result = questions_table.search(conditions[0])
        for condition in conditions[1:]:
            query_result = [q for q in query_result if questions_table.search(condition)]
    else:
        query_result = questions_table.all()
    
    # Sort by created_at (newest first)
    query_result.sort(key=lambda x: x['created_at'], reverse=True)
    
    # Pagination
    total = len(query_result)
    start = (page - 1) * limit
    end = start + limit
    paginated_questions = query_result[start:end]
    
    questions = [QuestionResponse(**q) for q in paginated_questions]
    
    return QuestionListResponse(
        questions=questions,
        total=total,
        page=page,
        limit=limit
    )

def get_question_by_id_service(question_id: str):
    """Get a specific question by ID"""
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Increment view count
    questions_table.update(
        {"view_count": question[0]["view_count"] + 1},
        Question.id == question_id
    )
    
    updated_question = questions_table.search(Question.id == question_id)[0]
    return QuestionResponse(**updated_question)

def update_question_service(question_id: str, question_data: QuestionUpdate, current_user: dict):
    """Update a question (owner only)"""
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if user is the owner
    if question[0]["author_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this question"
        )
    
    # Update fields
    update_data = {}
    if question_data.title is not None:
        update_data["title"] = question_data.title
    if question_data.description is not None:
        update_data["description"] = question_data.description
    if question_data.tags is not None:
        update_data["tags"] = question_data.tags
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    questions_table.update(update_data, Question.id == question_id)
    
    updated_question = questions_table.search(Question.id == question_id)[0]
    return QuestionResponse(**updated_question)

def delete_question_service(question_id: str, current_user: dict):
    """Delete a question (owner or admin only)"""
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if user is the owner or admin
    if question[0]["author_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this question"
        )
    
    questions_table.remove(Question.id == question_id)
    return {"message": "Question deleted successfully"}