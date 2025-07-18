import uuid
from datetime import datetime
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from tinydb import Query
from app.database import users_table
from app.utils import verify_password, get_password_hash, create_access_token, verify_token
from app.models import UserCreate, UserLogin, UserResponse, Token

import re
from typing import List, Optional
from app.database import questions_table
from app.models import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionListResponse

from app.database import answers_table
from app.models import AnswerCreate, AnswerUpdate, AnswerResponse, AnswerListResponse

from app.database import votes_table
from app.models import VoteCreate, VoteResult

from app.database import tags_table
from app.models import TagCreate, TagResponse, TagListResponse

from app.models import AdminBanUser, AdminMessage, AdminBanResponse, AdminMessageResponse, AdminReports

from app.database import notifications_table
from app.models import NotificationResponse, NotificationListResponse

import google.generativeai as genai
import time
from app.config import settings
from app.models import AIQuestionRequest, AIAnswerResponse



security = HTTPBearer()

#Users management and auth functions

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

#Qs Functions

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

#Ans Functions

def create_answer_service(question_id: str, answer_data: AnswerCreate, current_user: dict):
    """Create a new answer for a question"""
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    new_answer = {
        "id": str(uuid.uuid4()),
        "content": answer_data.content,
        "question_id": question_id,
        "author_id": current_user["id"],
        "author_username": current_user["username"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "vote_count": 0,
        "is_accepted": False
    }
    
    answers_table.insert(new_answer)
    
    # Update question's answer count
    questions_table.update(
        {"answer_count": question[0]["answer_count"] + 1},
        Question.id == question_id
    )
    
    # create notif for question owner
    question_owner_id = question[0]["author_id"]
    if question_owner_id != current_user["id"]:  # Don't notify if answering own question
        create_notification_helper(
            user_id=question_owner_id,
            notification_type="new_answer",
            message=f"{current_user['username']} answered your question",
            related_id=new_answer["id"]
        )
    
    return AnswerResponse(**new_answer)


def get_answers_service(question_id: str, sort: str = "newest"):
    """Get all answers for a question"""
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    Answer = Query()
    answers = answers_table.search(Answer.question_id == question_id)
    
    # Sort answers
    if sort == "votes":
        answers.sort(key=lambda x: x['vote_count'], reverse=True)
    elif sort == "oldest":
        answers.sort(key=lambda x: x['created_at'])
    else:  # newest (default)
        answers.sort(key=lambda x: x['created_at'], reverse=True)
    
    # Put accepted answer first if it exists
    accepted_answers = [a for a in answers if a.get('is_accepted', False)]
    other_answers = [a for a in answers if not a.get('is_accepted', False)]
    sorted_answers = accepted_answers + other_answers
    
    answer_responses = [AnswerResponse(**answer) for answer in sorted_answers]
    
    return AnswerListResponse(
        answers=answer_responses,
        total=len(answers),
        question_id=question_id
    )

def update_answer_service(answer_id: str, answer_data: AnswerUpdate, current_user: dict):
    """Update an answer (author only)"""
    Answer = Query()
    answer = answers_table.search(Answer.id == answer_id)
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    # Check if user is the author
    if answer[0]["author_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this answer"
        )
    
    # Update fields
    update_data = {}
    if answer_data.content is not None:
        update_data["content"] = answer_data.content
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    answers_table.update(update_data, Answer.id == answer_id)
    
    updated_answer = answers_table.search(Answer.id == answer_id)[0]
    return AnswerResponse(**updated_answer)

def delete_answer_service(answer_id: str, current_user: dict):
    """Delete an answer (author or admin only)"""
    Answer = Query()
    answer = answers_table.search(Answer.id == answer_id)
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    # Check if user is the author or admin
    if answer[0]["author_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this answer"
        )
    
    question_id = answer[0]["question_id"]
    
    # Remove the answer
    answers_table.remove(Answer.id == answer_id)
    
    # Update question's answer count
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    if question:
        questions_table.update(
            {"answer_count": max(0, question[0]["answer_count"] - 1)},
            Question.id == question_id
        )
    
    return {"message": "Answer deleted successfully"}

def accept_answer_service(answer_id: str, current_user: dict):
    """Mark answer as accepted (question owner only)"""
    Answer = Query()
    answer = answers_table.search(Answer.id == answer_id)
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    # Get the question to check ownership
    question_id = answer[0]["question_id"]
    Question = Query()
    question = questions_table.search(Question.id == question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if user is the question owner
    if question[0]["author_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only question owner can accept answers"
        )
    
    # Unaccept any previously accepted answers for this question
    answers_table.update(
        {"is_accepted": False},
        Answer.question_id == question_id
    )
    
    # Accept this answer
    answers_table.update(
        {"is_accepted": True},
        Answer.id == answer_id
    )
    
    # Update question with accepted answer ID
    questions_table.update(
        {"accepted_answer_id": answer_id},
        Question.id == question_id
    )
    
    updated_answer = answers_table.search(Answer.id == answer_id)[0]
    return AnswerResponse(**updated_answer)


#Voting Functions


def vote_answer_service(answer_id: str, vote_data: VoteCreate, current_user: dict):
    """Upvote or downvote an answer"""
    # Check if answer exists
    Answer = Query()
    answer = answers_table.search(Answer.id == answer_id)
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    # Validate vote type
    if vote_data.vote_type not in ["upvote", "downvote"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vote type must be 'upvote' or 'downvote'"
        )
    
    # Check if user already voted on this answer
    Vote = Query()
    existing_vote = votes_table.search(
        (Vote.answer_id == answer_id) & (Vote.user_id == current_user["id"])
    )
    
    if existing_vote:
        # Update existing vote if different
        if existing_vote[0]["vote_type"] != vote_data.vote_type:
            votes_table.update(
                {
                    "vote_type": vote_data.vote_type,
                    "created_at": datetime.utcnow().isoformat()
                },
                (Vote.answer_id == answer_id) & (Vote.user_id == current_user["id"])
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have already {vote_data.vote_type}d this answer"
            )
    else:
        # Create new vote
        new_vote = {
            "id": str(uuid.uuid4()),
            "answer_id": answer_id,
            "user_id": current_user["id"],
            "vote_type": vote_data.vote_type,
            "created_at": datetime.utcnow().isoformat()
        }
        votes_table.insert(new_vote)
    
    # Calculate new vote count
    upvotes = len(votes_table.search((Vote.answer_id == answer_id) & (Vote.vote_type == "upvote")))
    downvotes = len(votes_table.search((Vote.answer_id == answer_id) & (Vote.vote_type == "downvote")))
    new_vote_count = upvotes - downvotes
    
    # Update answer's vote count
    answers_table.update(
        {"vote_count": new_vote_count},
        Answer.id == answer_id
    )
    
    return VoteResult(
        message=f"Answer {vote_data.vote_type}d successfully",
        answer_id=answer_id,
        new_vote_count=new_vote_count,
        user_vote=vote_data.vote_type
    )

def remove_vote_service(answer_id: str, current_user: dict):
    """Remove user's vote from an answer"""
    # Check if answer exists
    Answer = Query()
    answer = answers_table.search(Answer.id == answer_id)
    
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    # Check if user has voted on this answer
    Vote = Query()
    existing_vote = votes_table.search(
        (Vote.answer_id == answer_id) & (Vote.user_id == current_user["id"])
    )
    
    if not existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You haven't voted on this answer"
        )
    
    # Remove the vote
    votes_table.remove(
        (Vote.answer_id == answer_id) & (Vote.user_id == current_user["id"])
    )
    
    # Recalculate vote count
    upvotes = len(votes_table.search((Vote.answer_id == answer_id) & (Vote.vote_type == "upvote")))
    downvotes = len(votes_table.search((Vote.answer_id == answer_id) & (Vote.vote_type == "downvote")))
    new_vote_count = upvotes - downvotes
    
    # Update answer's vote count
    answers_table.update(
        {"vote_count": new_vote_count},
        Answer.id == answer_id
    )
    
    return VoteResult(
        message="Vote removed successfully",
        answer_id=answer_id,
        new_vote_count=new_vote_count,
        user_vote=None
    )



# tag service functions
def get_tags_service(search: Optional[str] = None, limit: int = 100):
    """Get available tags for multi-select dropdown"""
    # Get all unique tags from existing questions
    all_questions = questions_table.all()
    tag_usage = {}
    
    # Count tag usage across all questions
    for question in all_questions:
        for tag in question.get('tags', []):
            tag_lower = tag.lower()
            if tag_lower in tag_usage:
                tag_usage[tag_lower]['count'] += 1
                # Keep the most recent capitalization
                tag_usage[tag_lower]['name'] = tag
            else:
                tag_usage[tag_lower] = {
                    'name': tag,
                    'count': 1
                }
    
    # Build simple tag responses
    tag_responses = []
    for tag_key, usage_data in tag_usage.items():
        # Apply search filter if provided
        if search and search.lower() not in usage_data['name'].lower():
            continue
            
        tag_response = TagResponse(
            name=usage_data['name'],
            usage_count=usage_data['count']
        )
        tag_responses.append(tag_response)
    
    # Sort by usage count (most popular first) for better UX
    tag_responses.sort(key=lambda x: x.usage_count, reverse=True)
    
    # Apply limit
    limited_tags = tag_responses[:limit]
    
    return TagListResponse(
        tags=limited_tags,
        total=len(tag_responses)
    )

def create_tag_service(tag_data: TagCreate, current_user: dict):
    """Simple tag creation - just validate and return the tag name"""
    tag_name = tag_data.name.strip()
    
    # Basic validation
    if len(tag_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag name must be at least 2 characters long"
        )
    
    if len(tag_name) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag name must be less than 30 characters"
        )
    
    # Return the tag (it will be created when used in a question)
    return TagResponse(
        name=tag_name,
        usage_count=0
    )



#admin service
def admin_ban_user_service(ban_data: AdminBanUser, current_user: dict):
    """Ban users - Admin only"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    User = Query()
    user_to_ban = users_table.search(User.id == ban_data.user_id)
    
    if not user_to_ban:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Simple ban - just set banned flag
    users_table.update(
        {"is_banned": True, "ban_reason": ban_data.reason},
        User.id == ban_data.user_id
    )
    
    return AdminBanResponse(
        message="User banned successfully",
        username=user_to_ban[0]["username"],
        reason=ban_data.reason
    )

def admin_send_message_service(message_data: AdminMessage, current_user: dict):
    """Send platform messages - Admin only"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Count active users
    active_users = [u for u in users_table.all() if not u.get("is_banned", False)]
    
    # Simple implementation - just return success
    return AdminMessageResponse(
        message="Platform message sent successfully",
        sent_to_users=len(active_users)
    )

def admin_reject_content_service(content_type: str, content_id: str, current_user: dict):
    """Reject inappropriate content - Admin only"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    Query_obj = Query()
    
    if content_type == "question":
        content = questions_table.search(Query_obj.id == content_id)
        if content:
            questions_table.remove(Query_obj.id == content_id)
            return {"message": "Question rejected and removed"}
    elif content_type == "answer":
        content = answers_table.search(Query_obj.id == content_id)
        if content:
            answers_table.remove(Query_obj.id == content_id)
            return {"message": "Answer rejected and removed"}
    
    raise HTTPException(status_code=404, detail="Content not found")

def admin_get_reports_service(current_user: dict):
    """Get basic platform reports - Admin only"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return AdminReports(
        total_users=len(users_table.all()),
        total_questions=len(questions_table.all()),
        total_answers=len(answers_table.all()),
        banned_users=len([u for u in users_table.all() if u.get("is_banned", False)])
    )




#notification service functions
def get_user_notifications_service(current_user: dict, limit: int = 10):
    """Get user notifications for dropdown"""
    Notification = Query()
    
    # Get user's notifications (recent first)
    user_notifications = notifications_table.search(Notification.user_id == current_user["id"])
    user_notifications.sort(key=lambda x: x['created_at'], reverse=True)
    
    # Limit for dropdown display
    recent_notifications = user_notifications[:limit]
    
    # Count unread
    unread_count = len([n for n in user_notifications if not n.get("is_read", False)])
    
    # Convert to response
    notification_responses = [NotificationResponse(**n) for n in recent_notifications]
    
    return NotificationListResponse(
        notifications=notification_responses,
        unread_count=unread_count
    )

def mark_notification_read_service(notification_id: str, current_user: dict):
    """Mark notification as read"""
    Notification = Query()
    
    notifications_table.update(
        {"is_read": True},
        (Notification.id == notification_id) & (Notification.user_id == current_user["id"])
    )
    
    return {"message": "Notification marked as read"}

def mark_all_notifications_read_service(current_user: dict):
    """Mark all notifications as read"""
    Notification = Query()
    
    notifications_table.update(
        {"is_read": True},
        Notification.user_id == current_user["id"]
    )
    
    return {"message": "All notifications marked as read"}

def create_notification_helper(user_id: str, notification_type: str, message: str, related_id: str = None):
    """Helper to create notifications"""
    new_notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "message": message,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat(),
        "related_id": related_id
    }
    
    notifications_table.insert(new_notification)


# Configure Google AI
genai.configure(api_key=settings.google_ai_api_key)

# # Add this AI service function
# def get_ai_answer_service(question_request: AIQuestionRequest):
#     """Get AI-generated answer using Gemini 2.0 Flash"""
#     try:
#         start_time = time.time()
        
#         # Initialize the Gemini model
#         model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
#         # Create a prompt for Q&A context
#         prompt = f"""
#         You are a helpful assistant for a Q&A platform called StackIt. 
#         Please provide a clear, concise, and helpful answer to the following question:
        
#         Question: {question_request.question}
        
#         Please format your response in a way that would be helpful for developers and tech enthusiasts.
#         """
        
#         # Generate response
#         response = model.generate_content(prompt)
        
#         end_time = time.time()
#         response_time = round(end_time - start_time, 2)
        
#         return AIAnswerResponse(
#             answer=response.text,
#             model_used="gemini-2.0-flash-exp",
#             response_time=response_time
#         )
        
#     except Exception as e:
#         # Handle API errors gracefully
#         return AIAnswerResponse(
#             answer=f"Sorry, I couldn't generate an answer at the moment. Error: {str(e)}",
#             model_used="gemini-2.0-flash-exp",
#             response_time=0.0
#         )
    


def get_ai_answer_service(question_request: AIQuestionRequest):
    """Get AI-generated answer using Gemini 2.5 Flash Lite Preview"""
    try:
        start_time = time.time()
        
        # Use Gemini 2.5 Flash Lite Preview model
        model = genai.GenerativeModel('gemini-2.5-flash-lite-preview-06-17')
        
        # Enhanced structured prompt for crisp, bullet-point answers
        prompt = f"""
        You are a technical expert for StackIt Q&A platform. 
        Provide a STRUCTURED, CONCISE answer to: {question_request.question}
        
        FORMAT REQUIREMENTS:
        • Use bullet points for key information
        • Keep answers SHORT and CRISP
        • Include code examples only if essential
        • Maximum 3-4 bullet points
        • Each point should be 1-2 sentences max
        
        EXAMPLE FORMAT:
        • **Main Solution**: Brief explanation
        • **Key Steps**: Essential actions to take
        • **Best Practice**: Important tip
        • **Common Pitfall**: What to avoid
        """
        
        response = model.generate_content(prompt)
        end_time = time.time()
        
        return AIAnswerResponse(
            answer=response.text,
            model_used="gemini-2.5-flash-lite-preview-06-17",
            response_time=round(end_time - start_time, 2)
        )
        
    except Exception as e:
        return AIAnswerResponse(
            answer="• **Error**: AI service temporarily unavailable\n• **Solution**: Try again in a moment or ask the community",
            model_used="error-handler",
            response_time=0.0
        )