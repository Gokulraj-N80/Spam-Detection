# ScamShield - AI Scam Message Detector

ScamShield is a cybersecurity web application that leverages Natural Language Processing (NLP) and Google's Gemini AI to instantly analyze text messages, emails, and links for phishing attempts and scam indicators.

## Features
- **AI Threat Analysis:** Uses Gemini 2.0 to detect urgency, financial language, requests for PII, and suspicious links.
- **NLP Preprocessing:** Uses spaCy and NLTK to extract lemmas, named entities, and core keywords.
- **Dashboard & History:** Tracks scan history and provides analytical insights on scam vs. safe messages (powered by Firebase).
- **Responsive UI:** Built with React and Vite for a fast, modern user experience.

## Tech Stack
- **Frontend:** React, Vite, Lucide React
- **Backend:** Python, FastAPI, Google Generative AI (Gemini)
- **NLP:** spaCy, NLTK
- **Database:** Firebase Firestore (with local JSON fallback)

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
3. Add a valid Google Gemini API Key starting with `AIza` to your `backend/.env` file.
4. Run the backend server:
   ```bash
   python run.py
   ```
   *(The server will run on `http://localhost:8000`)*

### 2. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *(The app will be accessible at `http://localhost:5173`)*

## Usage
Simply paste any suspicious message or URL into the scanner to receive an instant confidence score and safety recommendations.
