import React, { useState } from "react";
import { Play, LogIn, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ScanForm({ onScan, loading }) {
  const [message, setMessage] = useState("");
  const { user, loginWithGoogle } = useAuth();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    onScan(message);
  };

  const handleQuickFill = (text) => {
    setMessage(text);
  };

  return (
    <div className="scan-form-container">
      {/* Login Prompt Banner for Guest Users */}
      {!user && (
        <div className="login-prompt-banner">
          <div className="login-prompt-text">
            <h3>🔒 Protect Your Scan History</h3>
            <p>You are browsing in guest mode. Sign in with Google to automatically save logs and view analytics dashboards.</p>
          </div>
          <button className="btn btn-primary" onClick={loginWithGoogle}>
            <LogIn size={16} />
            Sign In Now
          </button>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: "1.25rem", display: "flex", alignParagraph: "center", gap: "0.5rem" }}>
          <MessageSquare style={{ color: "var(--color-primary)" }} />
          Analyze Message for Scams
        </h2>
        
        <form onSubmit={handleSubmit} className="scan-area">
          <div className="textarea-container">
            <textarea
              className="scan-textarea"
              placeholder="Paste a suspicious SMS, email, WhatsApp message, or website text link here to scan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              disabled={loading}
            />
            <div className="textarea-counter">
              {message.length} / 2000 characters
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            {/* Quick test buttons to help users test faster */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill("Urgent: Your bank account has been locked due to an unauthorized login. Click here immediately to verify: http://mockbank-security.com/verify")}
                disabled={loading}
              >
                Test Scam
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill("Hey, are we still meeting for lunch today at 1 PM? Let me know, thanks!")}
                disabled={loading}
              >
                Test Safe
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!message.trim() || loading}
              style={{ minWidth: "140px" }}
            >
              <Play size={16} fill="currentColor" />
              {loading ? "Analyzing..." : "Scan Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
