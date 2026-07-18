import json
import logging
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini if key is provided
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to configure Google Gemini API: {e}")

def analyze_message(original_text: str, nlp_data: dict) -> dict:
    """
    Sends preprocessed text and metadata to Gemini to analyze if it's a scam.
    If GEMINI_API_KEY is missing, falls back to a rule-based mock analysis.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        logger.warning("GEMINI_API_KEY is not configured. Running in Mock/Simulated AI mode.")
        return get_mock_analysis(original_text, nlp_data)

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # System instructions/prompt instructing the model to output valid JSON
        prompt = f"""
        You are ScamShield, an advanced cybersecurity AI specialized in detecting scam messages, phishing attempts, spam, and financial fraud.
        Analyze the following text message and its NLP metadata, then determine if it is a Scam or Safe.
        
        Original Message: "{original_text}"
        Preprocessed Lemmas: "{nlp_data['cleaned_text']}"
        Extracted Keywords: {nlp_data['keywords']}
        Named Entities: {nlp_data['entities']}
        
        You MUST respond with a single valid JSON object containing exactly the following keys:
        - "prediction": Either "Scam" or "Safe"
        - "probability": An integer from 0 to 100 representing the scam confidence/probability (0 means definitely safe, 100 means definitely a scam)
        - "reasons": A list of strings (2-4 reasons) explaining why you made this prediction based on language cues, urgency, links, request for info, etc.
        - "recommendations": A list of strings (2-3 recommendations) on how the user should handle this message safely.
        
        Return ONLY the raw JSON object. Do not include markdown formatting or backticks in your output.
        """
        
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        result_json = response.text.strip()
        
        # Clean up any potential markdown wrap, just in case
        if result_json.startswith("```json"):
            result_json = result_json[7:]
        if result_json.endswith("```"):
            result_json = result_json[:-3]
            
        data = json.loads(result_json.strip())
        return data
        
    except Exception as e:
        logger.error(f"Gemini API analysis failed: {e}. Falling back to simulated analysis.")
        logger.warning("TIP: Check that GEMINI_API_KEY in your .env is a valid Google AI API key (should start with 'AIza').")
        return get_mock_analysis(original_text, nlp_data)

def get_mock_analysis(original_text: str, nlp_data: dict) -> dict:
    """
    Fallback mock analyzer that uses weighted keyword matching and
    text pattern analysis to classify messages with varied, realistic scores.
    """
    import re
    text_lower = original_text.lower()
    score = 0  # Accumulate a threat score

    # --- Category 1: High-severity scam keywords (weight: 15 each) ---
    high_severity = [
        "gift card", "claim your", "irs", "unauthorized login", "ssn",
        "social security", "verify your account", "account suspended",
        "identity theft", "wire transfer", "western union", "moneygram"
    ]
    high_matches = [kw for kw in high_severity if kw in text_lower]
    score += len(high_matches) * 15

    # --- Category 2: Medium-severity scam keywords (weight: 8 each) ---
    medium_severity = [
        "urgent", "winner", "prize", "congratulations", "congrats",
        "lottery", "inherit", "bitcoin", "crypto", "investment opportunity",
        "cashapp", "refinance", "overdue", "payment due", "act now",
        "limited time", "exclusive offer", "risk free", "guaranteed",
        "click here", "click below", "click the link", "whatsapp me",
        "send money", "transfer funds", "police", "arrest", "warrant",
        "legal action", "court order", "tax refund"
    ]
    medium_matches = [kw for kw in medium_severity if kw in text_lower]
    score += len(medium_matches) * 8

    # --- Category 3: Low-severity suspicious words (weight: 3 each) ---
    low_severity = [
        "win", "free", "offer", "deal", "discount", "password",
        "bank account", "suspend", "expire", "confirm", "update your",
        "dear customer", "dear user", "dear sir", "selected", "chosen",
        "immediately", "asap", "right away", "don't delay"
    ]
    low_matches = [kw for kw in low_severity if kw in text_lower]
    score += len(low_matches) * 3

    # --- Pattern Analysis: URLs (weight: 10 for suspicious URLs) ---
    urls = re.findall(r'https?://\S+', text_lower)
    shortened_url_domains = ["bit.ly", "tinyurl", "t.co", "goo.gl", "is.gd", "shorturl"]
    has_suspicious_url = False
    for url in urls:
        if any(domain in url for domain in shortened_url_domains):
            score += 12
            has_suspicious_url = True
        else:
            # Any URL adds some suspicion
            score += 5
            has_suspicious_url = True

    # --- Pattern Analysis: Urgency phrases (weight: 6 each) ---
    urgency_phrases = [
        r"act\s+now", r"don'?t\s+ignore", r"last\s+chance", r"final\s+warning",
        r"respond\s+immediately", r"within\s+\d+\s+hours?", r"expires?\s+today",
        r"time\s+is\s+running\s+out", r"hurry", r"before\s+it'?s?\s+too\s+late"
    ]
    urgency_count = sum(1 for p in urgency_phrases if re.search(p, text_lower))
    score += urgency_count * 6

    # --- Pattern Analysis: Requests for personal information (weight: 10 each) ---
    personal_info_patterns = [
        r"(send|provide|share|confirm|verify)\s+(your|ur)\s+(password|ssn|social|account|pin|otp|code|credit\s*card)",
        r"(bank|account|card)\s+(number|details|information|info)",
        r"(date\s+of\s+birth|mother'?s?\s+maiden|security\s+question)"
    ]
    pii_count = sum(1 for p in personal_info_patterns if re.search(p, text_lower))
    score += pii_count * 10

    # --- Pattern Analysis: Financial language (weight: 5 each) ---
    financial_patterns = [
        r"\$\d+", r"£\d+", r"₹\d+", r"\d+\s*dollars?", r"\d+\s*rupees?",
        r"(million|billion|thousand)\s+(dollars?|pounds?|euros?)",
        r"(money|cash|funds?|payment)\s+(transfer|send|deposit|receive)"
    ]
    financial_count = sum(1 for p in financial_patterns if re.search(p, text_lower))
    score += financial_count * 5

    # --- Pattern Analysis: ALL CAPS words (more than 3 caps words = suspicious) ---
    caps_words = re.findall(r'\b[A-Z]{3,}\b', original_text)
    if len(caps_words) >= 3:
        score += 5

    # Collect all keyword matches for reporting
    all_matches = high_matches + medium_matches + low_matches

    # --- Determine classification based on accumulated score ---
    if score >= 20:
        # SCAM classification
        probability = min(max(35 + score, 40), 99)

        reasons = []
        if all_matches:
            reasons.append(f"Message contains suspicious trigger words: {', '.join(all_matches[:4])}.")
        if urgency_count > 0:
            reasons.append("High-urgency or threatening tone detected, pressuring immediate action.")
        if has_suspicious_url:
            reasons.append("Contains URL links that may lead to phishing or malicious sites.")
        if pii_count > 0:
            reasons.append("Requests sensitive personal information such as passwords, SSNs, or account details.")
        if financial_count > 0:
            reasons.append("References specific monetary amounts or financial transactions, common in fraud schemes.")
        if high_matches:
            reasons.append(f"High-severity scam indicators found: {', '.join(high_matches[:3])}.")
        if len(caps_words) >= 3:
            reasons.append("Excessive use of capitalized words to create a sense of alarm.")
        # Ensure at least 2 reasons
        if len(reasons) < 2:
            reasons.append("The message structure and tone match common patterns seen in scam communications.")
            reasons.append("Calls for direct action (e.g., verifying accounts, clicking links, or calling unknown numbers).")
        reasons = reasons[:4]

        recommendations = [
            "Do not click any links or call any numbers provided in the message.",
            "Never share passwords, banking credentials, or personal information (like SSN).",
            "Contact the purported sender organization directly via their official, trusted channels."
        ]
        return {
            "prediction": "Scam",
            "probability": probability,
            "reasons": reasons,
            "recommendations": recommendations
        }
    else:
        # SAFE classification — score is 0-19, map to a probability of 2-18
        probability = max(2, min(score + 2, 18))

        reasons = []
        if all_matches:
            reasons.append(f"Some potentially suspicious words detected ({', '.join(all_matches[:3])}), but insufficient to indicate a scam.")
        else:
            reasons.append("No common scam trigger words or high-urgency indicators detected.")
        reasons.append("The content structure appears normal and conversational.")
        if not has_suspicious_url:
            reasons.append("No suspicious links or URL redirects were found in the message.")
        else:
            reasons.append("A URL was found but does not match known malicious patterns.")
        reasons.append("No requests for sensitive personal data or credentials were identified.")
        reasons = reasons[:3]

        recommendations = [
            "This message appears to be safe, but continue to exercise normal caution with unknown senders.",
            "Keep software updated and never share verification codes (OTPs) with anyone."
        ]
        return {
            "prediction": "Safe",
            "probability": probability,
            "reasons": reasons,
            "recommendations": recommendations
        }
