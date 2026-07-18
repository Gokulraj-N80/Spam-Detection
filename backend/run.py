import uvicorn
import logging
from app.config import settings
from app.services.nlp_service import setup_nltk, get_spacy_nlp

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("run")

if __name__ == "__main__":
    logger.info("==========================================")
    logger.info(" ScamShield - AI Scam Detector Backend Server")
    logger.info("==========================================")
    
    # Warm up resources beforehand to prevent delayed execution on first API request
    logger.info("Initializing spaCy and NLTK resources. Please wait...")
    setup_nltk()
    get_spacy_nlp()
    
    logger.info("NLP initialization completed successfully.")
    logger.info(f"Database Mode: {'MOCK (local json)' if settings.USE_MOCK_DATABASE else 'LIVE FIREBASE'}")
    
    # Run uvicorn on the configured port
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
