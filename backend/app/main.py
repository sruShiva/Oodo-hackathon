from fastapi import FastAPI
from app.database import init_database
from app.routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="StackIt Q&A Platform",
    description="A minimal Q&A forum platform",
    version="1.0.0"
)

# Include routes

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

@app.on_event("startup")
async def startup_event():
    init_database()

@app.get("/")
async def root():
    return {"message": "StackIt Q&A Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}