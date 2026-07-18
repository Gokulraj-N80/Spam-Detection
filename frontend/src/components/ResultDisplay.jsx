import React from "react";
import { AlertTriangle, ShieldCheck, HelpCircle, ShieldAlert, Cpu, CheckCircle } from "lucide-react";

export default function ResultDisplay({ result }) {
  if (!result) return null;

  const { prediction, probability, reasons, recommendations, nlp_data, saved } = result;
  
  const isScam = prediction === "Scam";
  const gaugeColor = isScam ? "var(--color-danger)" : "var(--color-success)";
  
  // Calculate SVG circular path offsets
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div className="card" style={{ marginTop: "2rem", overflow: "hidden" }}>
      {/* Result Alert Header */}
      <div className="result-header">
        <div>
          <h3 style={{ fontSize: "1.35rem" }}>Scan Results Analysis</h3>
          {saved && (
            <p style={{ color: "var(--color-success)", fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
              <CheckCircle size={14} /> Saved to scan history
            </p>
          )}
        </div>
        <div className={`result-badge ${isScam ? "scam" : "safe"}`}>
          {isScam ? (
            <>
              <AlertTriangle size={20} />
              SCAM DETECTED
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              SAFE MESSAGE
            </>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Left Side: Circular Gauge */}
        <div className="gauge-section" style={{ borderRight: "1px solid var(--border-color)", paddingRight: "2rem" }}>
          <div className="gauge-circle">
            <svg className="gauge-svg">
              <circle className="gauge-track" cx="70" cy="70" r={radius} />
              <circle 
                className={`gauge-fill ${isScam ? "scam" : "safe"}`} 
                cx="70" 
                cy="70" 
                r={radius} 
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ filter: isScam ? "drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))" : "drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))" }}
              />
            </svg>
            <div className="gauge-text">
              <div className="gauge-percent">{probability}%</div>
              <div className="gauge-label">Threat</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <p style={{ fontWeight: 600, fontSize: "1rem" }}>
              {isScam ? "High Risk Detected" : "Low Risk Detected"}
            </p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              AI Confidence Score
            </p>
          </div>
        </div>

        {/* Right Side: Reasons & Safety Recommendations */}
        <div>
          {/* Reasons */}
          <h4 className="result-title">
            <ShieldAlert size={18} style={{ color: isScam ? "var(--color-danger)" : "var(--color-success)" }} />
            Why this classification?
          </h4>
          <ul className="result-list">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => (
                <li key={idx} className="result-list-item reason">
                  <AlertTriangle size={16} style={{ marginTop: "0.15rem" }} />
                  <span>{reason}</span>
                </li>
              ))
            ) : (
              <li className="result-list-item">No specific threats identified.</li>
            )}
          </ul>

          {/* Recommendations */}
          <h4 className="result-title" style={{ marginTop: "1.5rem" }}>
            <HelpCircle size={18} style={{ color: "var(--color-secondary)" }} />
            Safety recommendations
          </h4>
          <ul className="result-list">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <li key={idx} className="result-list-item recommendation">
                  <ShieldCheck size={16} style={{ marginTop: "0.15rem" }} />
                  <span>{rec}</span>
                </li>
              ))
            ) : (
              <li className="result-list-item">Always treat unknown sources with caution.</li>
            )}
          </ul>
        </div>
      </div>

      {/* NLP PREPROCESSING DETAILED DRAWER */}
      {nlp_data && (
        <details className="nlp-section">
          <summary>
            <Cpu size={16} />
            <span>Show Preprocessing & NLP Details (spaCy + NLTK)</span>
          </summary>
          <div className="nlp-content">
            <div className="nlp-meta-grid">
              <div className="nlp-meta-card">
                <div className="nlp-meta-val">{nlp_data.original_length}</div>
                <div className="nlp-meta-lbl">Original Chars</div>
              </div>
              <div className="nlp-meta-card">
                <div className="nlp-meta-val">{nlp_data.cleaned_length}</div>
                <div className="nlp-meta-lbl">Cleaned Chars</div>
              </div>
              <div className="nlp-meta-card">
                <div className="nlp-meta-val">{nlp_data.token_count} / {nlp_data.original_token_count}</div>
                <div className="nlp-meta-lbl">Filtered Lemmas</div>
              </div>
            </div>

            <div>
              <div className="nlp-sub-title">Preprocessed Lemmas Sent to AI</div>
              <div className="nlp-cleaned-box">
                {nlp_data.cleaned_text || <span style={{ fontStyle: "italic", color: "var(--color-text-secondary)" }}>None</span>}
              </div>
            </div>

            {nlp_data.keywords && nlp_data.keywords.length > 0 && (
              <div>
                <div className="nlp-sub-title">Extracted Core Keywords</div>
                <div className="tags-container">
                  {nlp_data.keywords.map((kw, i) => (
                    <span key={i} className="tag">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {nlp_data.entities && nlp_data.entities.length > 0 && (
              <div>
                <div className="nlp-sub-title">Named Entities Extracted (spaCy)</div>
                <div className="tags-container">
                  {nlp_data.entities.map((ent, i) => (
                    <span key={i} className="tag entity">
                      {ent.text} <strong style={{ fontSize: "0.6rem", opacity: 0.8 }}>({ent.label})</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
