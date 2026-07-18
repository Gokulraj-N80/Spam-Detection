import React, { useEffect, useState } from "react";
import { Trash2, Eye, RefreshCw, ShieldAlert, History } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function HistoryList({ setActiveTab, setViewResult }) {
  const { getToken } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch scan history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve scan history. Is the backend service active?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan from your history?")) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/history/${scanId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      // Update state to remove item immediately
      setHistory((prevHistory) => prevHistory.filter((item) => item.id !== scanId));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleInspect = (scanItem) => {
    setViewResult(scanItem);
    setActiveTab("scan");
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Unknown Date";
    }
  };

  if (loading) {
    return (
      <div className="analyzing-container">
        <div className="spinner"></div>
        <p className="pulse-text">Loading scan history logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
        <ShieldAlert size={48} style={{ color: "var(--color-danger)", marginBottom: "1rem" }} />
        <p style={{ color: "var(--color-danger)", fontWeight: 600, marginBottom: "1rem" }}>{error}</p>
        <button className="btn btn-secondary" onClick={fetchHistory}>
          <RefreshCw size={14} /> Try Reloading
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-title-section">
        <h2>Scan Logs & History</h2>
        <p className="page-subtitle">Inspect, re-examine, or delete previous message checks.</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ display: "flex", alignParagraph: "center", gap: "0.5rem" }}>
            <History size={20} style={{ color: "var(--color-primary)" }} />
            History Log ({history.length} records)
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchHistory} title="Reload history">
            <RefreshCw size={14} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <History size={48} />
            <p>Your scan log is empty. Any scans you execute while logged in will appear here.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab("scan")}>
              Scan First Message
            </button>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Original Message Preview</th>
                  <th>Classification</th>
                  <th>Threat Score</th>
                  <th>Scan Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((scan) => (
                  <tr key={scan.id}>
                    <td>
                      <div className="msg-preview" title={scan.message}>
                        {scan.message}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${scan.prediction === "Scam" ? "scam" : "safe"}`}>
                        {scan.prediction}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: scan.prediction === "Scam" ? "var(--color-danger)" : "var(--color-success)" }}>
                        {scan.probability}%
                      </strong>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {formatDate(scan.timestamp)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleInspect(scan)}
                          style={{ display: "inline-flex", padding: "0.25rem 0.6rem" }}
                          title="Inspect Details"
                        >
                          <Eye size={13} />
                          View
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm btn-danger" 
                          onClick={() => handleDelete(scan.id)}
                          style={{ display: "inline-flex", padding: "0.25rem 0.6rem" }}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
