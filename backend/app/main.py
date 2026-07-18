from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import scan, history

app = FastAPI(
    title="ScamShield API",
    description="Backend API for AI Scam Message Detector",
    version="1.0.0"
)

# Configure CORS so React (running on Port 5173) can consume this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(scan.router, prefix="/api")
app.include_router(history.router, prefix="/api")

@app.get("/")
def health_check():
    """
    Service health check endpoint.
    """
    return {
        "status": "healthy",
        "app": "ScamShield - AI Scam Message Detector REST API",
        "mock_db_mode": settings.USE_MOCK_DATABASE
    }
