import os
import json
from datetime import datetime
import uuid
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
db = None
firebase_initialized = False

# Try to initialize real Firebase if configured and mock is disabled
if not settings.USE_MOCK_DATABASE:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Check if already initialized to avoid duplication
        if not firebase_admin._apps:
            if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
                # Handle double-escaped newlines in private key
                private_key = settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n').strip('"')
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "private_key": private_key,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            else:
                logger.info("Firebase configuration variables missing. Trying default credentials.")
                firebase_admin.initialize_app()
                
        db = firestore.client()
        firebase_initialized = True
        logger.info("Firebase Admin initialized successfully in Live Mode.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}. Falling back to MOCK mode.")
        settings.USE_MOCK_DATABASE = True

# --- MOCK DATABASE CODE ---
MOCK_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "mock_db.json")

def read_mock_db() -> dict:
    """Reads the local JSON file database."""
    if not os.path.exists(MOCK_DB_PATH):
        return {}
    try:
        with open(MOCK_DB_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading mock DB: {e}")
        return {}

def write_mock_db(data: dict):
    """Writes to the local JSON file database."""
    try:
        with open(MOCK_DB_PATH, "w") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to write mock database: {e}")

# --- DB SERVICE METHODS ---

def save_scan(user_id: str, scan_result: dict, message: str) -> dict:
    """
    Saves a scan result under the user's scan history.
    """
    scan_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    scan_doc = {
        "id": scan_id,
        "user_id": user_id,
        "message": message,
        "prediction": scan_result["prediction"],
        "probability": scan_result["probability"],
        "reasons": scan_result["reasons"],
        "recommendations": scan_result["recommendations"],
        "nlp_data": {
            "cleaned_text": scan_result["nlp_data"].get("cleaned_text", ""),
            "original_length": scan_result["nlp_data"].get("original_length", 0),
            "cleaned_length": scan_result["nlp_data"].get("cleaned_length", 0),
            "token_count": scan_result["nlp_data"].get("token_count", 0),
            "original_token_count": scan_result["nlp_data"].get("original_token_count", 0),
            "entities": scan_result["nlp_data"].get("entities", []),
            "keywords": scan_result["nlp_data"].get("keywords", [])
        },
        "timestamp": timestamp
    }
    
    if not settings.USE_MOCK_DATABASE and firebase_initialized:
        try:
            # Overwrite mock ID with Firestore ID
            doc_ref = db.collection("scans").document()
            scan_doc["id"] = doc_ref.id
            doc_ref.set(scan_doc)
            return scan_doc
        except Exception as e:
            logger.error(f"Firestore save_scan failed: {e}. Attempting mock save.")
            
    # Mock save
    mock_data = read_mock_db()
    if user_id not in mock_data:
        mock_data[user_id] = []
    mock_data[user_id].append(scan_doc)
    write_mock_db(mock_data)
    return scan_doc

def get_history(user_id: str) -> list:
    """
    Retrieves the complete scan history for a user, sorted descending by timestamp.
    """
    if not settings.USE_MOCK_DATABASE and firebase_initialized:
        try:
            scans_ref = db.collection("scans")
            # Query scans for this user ordered by timestamp descending
            query = scans_ref.where("user_id", "==", user_id).order_by("timestamp", direction="DESCENDING")
            docs = query.stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Firestore get_history failed: {e}. Querying local mock DB.")
            
    # Mock retrieval
    mock_data = read_mock_db()
    user_scans = mock_data.get(user_id, [])
    # Sort descending
    return sorted(user_scans, key=lambda x: x["timestamp"], reverse=True)

def delete_scan(user_id: str, scan_id: str) -> bool:
    """
    Deletes a specific scan record if it belongs to the authenticated user.
    """
    if not settings.USE_MOCK_DATABASE and firebase_initialized:
        try:
            doc_ref = db.collection("scans").document(scan_id)
            doc = doc_ref.get()
            if doc.exists:
                data = doc.to_dict()
                if data.get("user_id") == user_id:
                    doc_ref.delete()
                    return True
            return False
        except Exception as e:
            logger.error(f"Firestore delete_scan failed: {e}. Trying local mock delete.")
            
    # Mock delete
    mock_data = read_mock_db()
    if user_id in mock_data:
        original_len = len(mock_data[user_id])
        mock_data[user_id] = [item for item in mock_data[user_id] if item["id"] != scan_id]
        if len(mock_data[user_id]) < original_len:
            write_mock_db(mock_data)
            return True
    return False

def get_dashboard_stats(user_id: str) -> dict:
    """
    Calculates summary metrics and returns recent history logs for the dashboard.
    """
    # Simply reuse get_history to avoid redundant DB querying logic or index requirements
    history = get_history(user_id)
    total_scans = len(history)
    scam_count = sum(1 for item in history if item["prediction"] == "Scam")
    safe_count = sum(1 for item in history if item["prediction"] == "Safe")
    recent_scans = history[:5]  # Limit to 5 items
    
    return {
        "total_scans": total_scans,
        "scam_count": scam_count,
        "safe_count": safe_count,
        "recent_scans": recent_scans
    }
