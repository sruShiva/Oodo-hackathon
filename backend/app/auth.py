import uuid
from datetime import datetime
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from tinydb import Query
from app.database import users_table
from app.utils import verify_password, get_password_hash, create_access_token, verify_token
from app.models import UserCreate, UserLogin, UserResponse, Token

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