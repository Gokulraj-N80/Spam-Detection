import spacy
from spacy.cli import download
import nltk
from nltk.corpus import stopwords
import logging

logger = logging.getLogger(__name__)

nlp = None
stop_words = set()

def get_spacy_nlp():
    """Lazy load spaCy model, downloading it if not present."""
    global nlp
    if nlp is not None:
        return nlp
    
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        logger.warning("spaCy model 'en_core_web_sm' not found. Attempting to download...")
        try:
            download("en_core_web_sm")
            nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            logger.error(f"Failed to download spaCy model: {e}")
            nlp = None
    return nlp

def setup_nltk():
    """Ensure NLTK stopwords and punkt are downloaded and load stopwords."""
    global stop_words
    if stop_words:
        return
        
    try:
        stop_words = set(stopwords.words("english"))
    except LookupError:
        logger.warning("NLTK stopwords dataset not found. Downloading...")
        try:
            nltk.download("stopwords", quiet=True)
            nltk.download("punkt", quiet=True)
            stop_words = set(stopwords.words("english"))
        except Exception as e:
            logger.error(f"Failed to download NLTK datasets: {e}")
            # Fallback basic stop words
            stop_words = {
                "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
                "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "what", "which",
                "who", "whom", "this", "that", "am", "is", "are", "was", "were", "be", "been", "being",
                "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", 
                "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", 
                "about", "against", "between", "into", "through", "during", "before", "after", "above", 
                "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", 
                "further", "then", "once"
            }

def preprocess_text(text: str) -> dict:
    """
    Cleans and preprocesses the input text using spaCy and NLTK.
    Returns the cleaned text and key metadata.
    """
    if not text or not text.strip():
        return {
            "cleaned_text": "",
            "original_length": 0,
            "cleaned_length": 0,
            "token_count": 0,
            "original_token_count": 0,
            "entities": [],
            "keywords": []
        }

    setup_nltk()
    nlp_model = get_spacy_nlp()
    
    original_tokens = text.split()
    original_token_count = len(original_tokens)
    
    if nlp_model is not None:
        try:
            doc = nlp_model(text)
            
            cleaned_tokens = []
            keywords = []
            
            for token in doc:
                lemma = token.lemma_.lower().strip()
                # Filter stopwords and non-alphanumeric tokens
                is_stop = token.is_stop or lemma in stop_words
                is_punct = token.is_punct or not token.text.strip()
                
                if not is_punct and not is_stop and len(lemma) > 1:
                    cleaned_tokens.append(lemma)
                    if token.pos_ in ["NOUN", "VERB", "ADJ", "PROPN"]:
                        keywords.append(lemma)
            
            # Extract entities (like Money, Dates, Names, Orgs which are common in scams)
            entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
            
            cleaned_text = " ".join(cleaned_tokens)
            unique_keywords = list(dict.fromkeys(keywords))[:10]
            
            return {
                "cleaned_text": cleaned_text,
                "original_length": len(text),
                "cleaned_length": len(cleaned_text),
                "token_count": len(cleaned_tokens),
                "original_token_count": original_token_count,
                "entities": entities,
                "keywords": unique_keywords
            }
        except Exception as e:
            logger.error(f"Error during spaCy processing: {e}")
            # Fall back to basic preprocessing if spaCy breaks
            pass
            
    # Basic Preprocessing Fallback
    cleaned_tokens = []
    for word in original_tokens:
        # Strip non-alphanumeric characters
        cleaned = "".join(c for c in word if c.isalnum()).lower()
        if cleaned and cleaned not in stop_words:
            cleaned_tokens.append(cleaned)
            
    cleaned_text = " ".join(cleaned_tokens)
    unique_keywords = list(dict.fromkeys(cleaned_tokens))[:10]
    
    return {
        "cleaned_text": cleaned_text,
        "original_length": len(text),
        "cleaned_length": len(cleaned_text),
        "token_count": len(cleaned_tokens),
        "original_token_count": original_token_count,
        "entities": [],
        "keywords": unique_keywords
    }
