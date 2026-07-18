import React from "react";
import { Shield, LogIn, LogOut, LayoutDashboard, History, MessageSquareWarning } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, loginWithGoogle, logout, isMock } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => setActiveTab("scan")}>
        <Shield size={28} />
        <span>ScamShield</span>
      </div>

      <div className="nav-actions">
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === "scan" ? "active" : ""}`}
            onClick={() => setActiveTab("scan")}
          >
            <MessageSquareWarning size={16} />
            Scanner
          </button>
          
          {user && (
            <>
              <button
                className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                className={`nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                <History size={16} />
                History
              </button>
            </>
          )}
        </div>

        {/* Database Mode Badge */}
        <div className={`mode-badge ${!isMock ? "live" : ""}`}>
          <div 
            style={{ 
              width: 6, 
              height: 6, 
              borderRadius: "50%", 
              background: isMock ? "#F59E0B" : "#10B981" 
            }} 
          />
          {isMock ? "Mock Database" : "Live Firebase"}
        </div>

        {/* Auth / Profile Area */}
        {user ? (
          <div className="user-profile">
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              className="user-avatar" 
              onError={(e) => {
                e.target.src = "https://api.dicebear.com/7.x/identicon/svg?seed=shield";
              }}
            />
            <span className="user-name" title={user.displayName}>
              {user.displayName}
            </span>
            <button 
              className="btn btn-secondary btn-sm btn-danger" 
              onClick={logout}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={loginWithGoogle}>
            <LogIn size={15} />
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
