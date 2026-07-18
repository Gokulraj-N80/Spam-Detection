import React, { useState } from "react";
import Navbar from "./components/Navbar";
import ScanForm from "./components/ScanForm";
import ResultDisplay from "./components/ResultDisplay";
import Dashboard from "./components/Dashboard";
import HistoryList from "./components/HistoryList";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ShieldAlert, ShieldCheck } from "lucide-react";

function MainContent() {
  const [activeTab, setActiveTab] = useState("scan");
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const { getToken } = useAuth();

  const handleScan = async (messageText) => {
    setScanLoading(true);
    setScanError(null);
    setScanResult(null);

    try {
      const headers = {
        "Content-Type": "application/json"
      };

      // Get ID token if user is signed in
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/scan`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please check backend status.");
      }

      const data = await response.json();
      setScanResult(data);
    } catch (err) {
      console.error(err);
      setScanError("Failed to communicate with ScamShield API. Ensure the backend server is running.");
    } finally {
      setScanLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="content-container">
        {activeTab === "scan" && (
          <div>
            <div className="page-title-section">
              <h2>Scam Message Scanner</h2>
              <p className="page-subtitle">Instantly analyze messages, emails, or links for scam indicators.</p>
            </div>
            
            <ScanForm onScan={handleScan} loading={scanLoading} />
            
            {scanLoading && (
              <div className="card" style={{ marginTop: "2rem" }}>
                <div className="analyzing-container">
                  <div className="spinner"></div>
                  <p className="pulse-text">Running NLP Preprocessing & AI Threat Scan...</p>
                </div>
              </div>
            )}

            {scanError && (
              <div className="card" style={{ marginTop: "2rem", borderLeft: "4px solid var(--color-danger)" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <ShieldAlert size={28} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
                  <p style={{ color: "var(--color-danger)", fontWeight: 500 }}>{scanError}</p>
                </div>
              </div>
            )}

            {!scanLoading && scanResult && (
              <ResultDisplay result={scanResult} />
            )}
          </div>
        )}

        {activeTab === "dashboard" && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setViewResult={(resultItem) => {
              // Map saved history schema to result display schema
              setScanResult({
                prediction: resultItem.prediction,
                probability: resultItem.probability,
                reasons: resultItem.reasons,
                recommendations: resultItem.recommendations,
                nlp_data: resultItem.nlp_data,
                saved: true,
                scan_id: resultItem.id
              });
            }} 
          />
        )}

        {activeTab === "history" && (
          <HistoryList 
            setActiveTab={setActiveTab} 
            setViewResult={(resultItem) => {
              // Map saved history schema to result display schema
              setScanResult({
                prediction: resultItem.prediction,
                probability: resultItem.probability,
                reasons: resultItem.reasons,
                recommendations: resultItem.recommendations,
                nlp_data: resultItem.nlp_data,
                saved: true,
                scan_id: resultItem.id
              });
            }} 
          />
        )}
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} <span>ScamShield</span>. Powered by Google Gemini AI, spaCy, and FastAPI.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
