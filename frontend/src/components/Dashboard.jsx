import React, { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Layers, RefreshCw, Eye, MessageSquareWarning } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard({ setActiveTab, setViewResult }) {
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/history/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to load dashboard metrics");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Unable to communicate with the service. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "Unknown Date";
    }
  };

  const handleInspect = (scanItem) => {
    setViewResult(scanItem);
    setActiveTab("scan");
  };

  if (loading) {
    return (
      <div className="analyzing-container">
        <div className="spinner"></div>
        <p className="pulse-text">Syncing dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
        <ShieldAlert size={48} style={{ color: "var(--color-danger)", marginBottom: "1rem" }} />
        <p style={{ color: "var(--color-danger)", fontWeight: 600, marginBottom: "1rem" }}>{error}</p>
        <button className="btn btn-secondary" onClick={fetchDashboardStats}>
          <RefreshCw size={14} /> Retry Sync
        </button>
      </div>
    );
  }

  const { total_scans, scam_count, safe_count, recent_scans } = stats || {
    total_scans: 0,
    scam_count: 0,
    safe_count: 0,
    recent_scans: []
  };

  return (
    <div>
      <div className="page-title-section">
        <h2>Dashboard Analytics</h2>
        <p className="page-subtitle">Historical overview and threat trends for your scans.</p>
      </div>

      {/* Grid of Analytics Summary Cards */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-icon total">
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{total_scans}</div>
            <div className="stat-label">Total Messages Scanned</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon scam" style={{ filter: "drop-shadow(0 0 8px rgba(239, 68, 68, 0.2))" }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: "var(--color-danger)" }}>{scam_count}</div>
            <div className="stat-label">Scam Messages Detections</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon safe" style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.2))" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: "var(--color-success)" }}>{safe_count}</div>
            <div className="stat-label">Safe Messages Cleared</div>
          </div>
        </div>
      </div>

      {/* Recent Scans Area */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ display: "flex", alignParagraph: "center", gap: "0.5rem" }}>
            <MessageSquareWarning size={20} style={{ color: "var(--color-primary)" }} />
            Recent Scans Activity
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardStats} title="Reload stats">
            <RefreshCw size={14} />
          </button>
        </div>

        {recent_scans.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert size={48} />
            <p>No recent activity. Scan a message to populate this list.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab("scan")}>
              Go to Scanner
            </button>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Message Preview</th>
                  <th>Classification</th>
                  <th>Threat Prob.</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_scans.map((scan) => (
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
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", padding: "0.25rem 0.6rem" }}
                        onClick={() => handleInspect(scan)}
                      >
                        <Eye size={13} />
                        View
                      </button>
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
