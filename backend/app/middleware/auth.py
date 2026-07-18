from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# We set auto_error=False so that we don't crash when guest users scan without headers
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodes and verifies the Firebase JWT token from the Authorization header.
    Supports a mock token fallback for testing.
    """
    if not credentials:
        return None  # Guest user, returns None

    token = credentials.credentials
    if not token:
        return None

    # Handle Mock Token verification if settings dictate or it's a mock token
    if settings.USE_MOCK_DATABASE or token.startswith("mock_"):
        if token.startswith("mock_"):
            try:
                # Expected format: mock_uid|email|name
                parts = token.split("|")
                uid = parts[0]
                email = parts[1] if len(parts) > 1 else "guest@scamshield.local"
                name = parts[2] if len(parts) > 2 else "Mock User"
                return {"uid": uid, "email": email, "name": name}
            except Exception:
                return {"uid": "mock_default_user", "email": "mock.default@scamshield.local", "name": "Mock User"}
        else:
            return {"uid": "mock_default_user", "email": "mock.default@scamshield.local", "name": "Mock User"}

    try:
        # Real Firebase ID token verification
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name", decoded_token.get("email", "Firebase User"))
        }
    except Exception as e:
        logger.error(f"Firebase token verification failed: {e}")
        raise HTTPException(
            status_code=401, 
            detail="Authentication token is expired, invalid, or malformed"
        )
