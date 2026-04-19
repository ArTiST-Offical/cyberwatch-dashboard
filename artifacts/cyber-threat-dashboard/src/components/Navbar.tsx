import { useState, useEffect } from "react";
import { Shield, Activity, Globe, BarChart2, Rss } from "lucide-react";
import { useGetThreatStats } from "@workspace/api-client-react";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [utcTime, setUtcTime] = useState<string>("");
  const { data: stats } = useGetThreatStats({ query: { refetchInterval: 15000 } });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace(" GMT", " UTC").split(" ").slice(1, 5).join(" "));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Globe },
    { id: "threats", label: "Threats", icon: Activity },
    { id: "news", label: "Intel Feed", icon: Rss },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <nav style={{
      background: "hsl(220, 20%, 6%)",
      borderBottom: "1px solid hsl(220, 15%, 12%)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ padding: "0 24px", display: "flex", alignItems: "center", height: "56px", gap: "24px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginRight: "16px" }}>
          <div style={{ position: "relative" }}>
            <Shield size={22} style={{ color: "#14b8a6" }} />
            <div className="live-dot" style={{
              position: "absolute", top: "-2px", right: "-2px",
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#ef4444",
            }} />
          </div>
          <div>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#e2e8f0", letterSpacing: "-0.01em" }}>
              CyberWatch
            </span>
            <span style={{ fontSize: "10px", color: "#14b8a6", marginLeft: "6px", letterSpacing: "0.08em", fontWeight: "600" }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ display: "flex", gap: "4px" }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`nav-link ${currentPage === id ? "active" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer",
                color: currentPage === id ? "#14b8a6" : "#64748b",
                backgroundColor: currentPage === id ? "rgba(20, 184, 166, 0.08)" : "transparent",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Live indicator */}
        {stats && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#475569" }}>APM</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#14b8a6", fontFamily: "monospace" }}>
                {stats.attacksPerMinute.toFixed(2)}
              </span>
            </div>
            <div style={{ width: "1px", height: "20px", background: "hsl(220, 15%, 18%)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="live-dot" style={{
                width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444",
                boxShadow: "0 0 6px #ef4444",
              }} />
              <span className="live-text" style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", letterSpacing: "0.1em" }}>
                LIVE
              </span>
            </div>
          </div>
        )}

        <div style={{ width: "1px", height: "20px", background: "hsl(220, 15%, 18%)" }} />

        {/* UTC Clock */}
        <div style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
          {utcTime}
        </div>
      </div>

      {/* Top ad banner */}
      <div className="ad-zone" style={{
        margin: "0 24px 8px",
        height: "50px",
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: "14px",
      }}>
        <span style={{ fontSize: "11px", color: "#334155" }}>
          — Your advertisement could appear here (728×90) —
        </span>
      </div>
    </nav>
  );
}
