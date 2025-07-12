# 🚀 StackIt Q&A Platform - Backend

A modern Q&A platform built with FastAPI, powered by Google Gemini AI for intelligent answers, and secured using JWT authentication.

---

## ✨ Features

### Core Functionality

- **User Authentication**  
  JWT-based registration and login system with bcrypt-hashed passwords.

- **Question Management**  
  Create, read, update, delete questions with support for tags and search-based filtering.

- **Answer System**  
  Post, update, delete, and accept answers for any question.

- **Voting System**  
  Upvote or downvote answers, with support for vote removal.

- **Tag Management**  
  Multi-select tag system with tag search and dynamic creation.

- **Notification System**  
  Bell icon notifications for new answers, mentions, and updates.

- **Admin Panel**  
  Tools for banning users, content moderation, sending messages, and generating reports.

- **AI-Powered Answers**  
  Instantly fetch AI-generated answers using Gemini 2.0 Flash Lite.

---

## 🧱 Technical Stack

- **Framework**: FastAPI 0.116.1  
- **Database**: TinyDB 4.8.2 (JSON-based, file storage)  
- **Authentication**: JWT + bcrypt  
- **AI Integration**: Google Generative AI (Gemini)  
- **Validation**: Pydantic 2.11.7  

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Settings and configuration
│   ├── database.py             # TinyDB setup
│   ├── models.py               # All Pydantic models
│   ├── auth.py                 # Authentication & business logic
│   ├── routes.py               # All API endpoints
│   └── utils.py                # Security utilities
├── data/
│   └── stackit.json            # TinyDB database file
├── venv/                       # Virtual environment
├── .env                        # Environment variables
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.11+
- pip (Python package manager)

### 1. Clone and Setup Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the `backend/` directory:

```
SECRET_KEY=your-super-secret-jwt-key-here
DATABASE_PATH=data/stackit.json
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

Generate a secure secret key:

```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(64))"
```

Get a Google AI API Key:

- Visit [Google AI Studio](https://makersuite.google.com/)
- Sign in
- Generate an API key
- Paste it into the `.env` file

### 3. Run the Application

```bash
uvicorn app.main:app --reload
```

The server will be running at:  
[http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 📚 API Documentation

Interactive documentation is available:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📌 API Overview

### Authentication

- `POST /auth/register` – Register new users
- `POST /auth/login` – Login and receive JWT token
- `POST /auth/logout` – Logout (placeholder)
- `GET /users/profile` – Get user profile (requires token)

### Question Management

- `POST /questions` – Create a question
- `GET /questions` – List questions with pagination, search, tag filters
- `GET /questions/{question_id}` – Get specific question details
- `PUT /questions/{question_id}` – Update a question
- `DELETE /questions/{question_id}` – Delete a question

### Answer Management

- `POST /questions/{question_id}/answers` – Post an answer
- `GET /questions/{question_id}/answers` – List all answers
- `PUT /answers/{answer_id}` – Update an answer
- `DELETE /answers/{answer_id}` – Delete an answer
- `POST /answers/{answer_id}/accept` – Accept an answer

### Voting

- `POST /answers/{answer_id}/vote` – Upvote/downvote
- `DELETE /answers/{answer_id}/vote` – Remove vote

### Tags

- `GET /tags` – Get tag list with optional search
- `POST /tags` – Create a new tag

### Notifications

- `GET /notifications` – Fetch notifications
- `PUT /notifications/{notification_id}/read` – Mark one as read
- `PUT /notifications/read-all` – Mark all as read

### Admin

- `POST /admin/ban-user` – Ban a user
- `POST /admin/messages` – Send announcements
- `DELETE /admin/moderate/{content_type}/{content_id}` – Moderate content
- `GET /admin/reports` – Download reports

### AI-Powered Answers

- `POST /questions/answers_ai` – Get AI-generated answer using Gemini 2.0

---

## 🚦 Health Check

- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🧪 Testing

- Run the server using `uvicorn`
- Visit `/docs` for interactive Swagger testing
- Ensure authenticated endpoints use `Bearer` token headers

---

## 📦 Dependencies

```text
fastapi==0.116.1
uvicorn==0.35.0
tinydb==4.8.2
PyJWT==2.10.1
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
pydantic==2.11.7
pydantic-settings==2.7.0
email-validator==2.2.0
python-dotenv==1.1.1
google-generativeai==0.8.3
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit and push your changes
4. Open a pull request for review

---

## 🆘 Support

- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

Built with ❤️ using FastAPI and Google Gemini AI.
