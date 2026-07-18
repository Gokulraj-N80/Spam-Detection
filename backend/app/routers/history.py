from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.middleware.auth import get_current_user
from app.services import firebase_service
import logging

router = APIRouter(prefix="/history", tags=["history"])
logger = logging.getLogger(__name__)

@router.get("")
def get_user_history(user: dict = Depends(get_current_user)):
    """
    Fetches the scan history list for the logged-in user.
    """
    if user is None:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized. Please log in with Google to view your scan history."
        )
    try:
        return firebase_service.get_history(user["uid"])
    except Exception as e:
        logger.error(f"Error fetching history for user {user['uid']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scan history")

@router.get("/dashboard")
def get_dashboard_data(user: dict = Depends(get_current_user)):
    """
    Fetches summary analytics (total scans, scam/safe counts, and recent logs) for the dashboard.
    """
    if user is None:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized. Please log in with Google to view dashboard statistics."
        )
    try:
        return firebase_service.get_dashboard_stats(user["uid"])
    except Exception as e:
        logger.error(f"Error fetching dashboard stats for user {user['uid']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@router.delete("/{scan_id}")
def delete_history_item(scan_id: str, user: dict = Depends(get_current_user)):
    """
    Deletes a specific scan record from the user's history database.
    """
    if user is None:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized. Please log in with Google to perform this action."
        )
    try:
        deleted = firebase_service.delete_scan(user["uid"], scan_id)
        if not deleted:
            raise HTTPException(
                status_code=404, 
                detail="Scan item not found or you do not have permission to delete it."
            )
        return {"status": "success", "message": "Scan record deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting scan {scan_id} for user {user['uid']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete scan record")
