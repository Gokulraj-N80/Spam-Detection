from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.middleware.auth import get_current_user
from app.services.nlp_service import preprocess_text
from app.services.gemini_service import analyze_message
from app.services import firebase_service
import logging

router = APIRouter(prefix="/scan", tags=["scan"])
logger = logging.getLogger(__name__)

class ScanRequest(BaseModel):
    message: str

class ScanResponse(BaseModel):
    prediction: str
    probability: int
    reasons: List[str]
    recommendations: List[str]
    nlp_data: dict
    saved: bool = False
    scan_id: Optional[str] = None

@router.post("", response_model=ScanResponse)
def scan_message(request: ScanRequest, user: Optional[dict] = Depends(get_current_user)):
    """
    Scans a message text.
    1. Preprocesses the text using NLTK and spaCy.
    2. Runs AI classification using Gemini API (or mock).
    3. Saves results in history if the user is logged in.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
        
    try:
        # 1. Apply NLP preprocessing
        nlp_data = preprocess_text(request.message)
        
        # 2. Get AI Analysis from Gemini
        analysis = analyze_message(request.message, nlp_data)
        
        result = {
            "prediction": analysis.get("prediction", "Safe"),
            "probability": int(analysis.get("probability", 0)),
            "reasons": analysis.get("reasons", []),
            "recommendations": analysis.get("recommendations", []),
            "nlp_data": nlp_data
        }
        
        saved = False
        scan_id = None
        
        # 3. If authenticated, save to database
        if user is not None:
            try:
                saved_doc = firebase_service.save_scan(user["uid"], result, request.message)
                saved = True
                scan_id = saved_doc.get("id")
            except Exception as db_err:
                logger.error(f"Failed to save scan history: {db_err}")
                # We do not crash the scan response if DB save fails
                
        return ScanResponse(
            prediction=result["prediction"],
            probability=result["probability"],
            reasons=result["reasons"],
            recommendations=result["recommendations"],
            nlp_data=result["nlp_data"],
            saved=saved,
            scan_id=scan_id
        )
    except Exception as e:
        logger.error(f"Error executing scan message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze message: {str(e)}")
