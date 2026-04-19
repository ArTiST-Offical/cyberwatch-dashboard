import { countryFlag, timeAgo, getSeverityColor } from "@/lib/utils";

interface ThreatEvent {
  id: string;
  attackerCountry: string;
  attackerCountryCode: string;
  targetCountry: string;
  targetCountryCode: string;
  attackType: string;
  severity: string;
  timestamp: string;
  technique?: string;
}

interface AttackFeedProps {
  threats: ThreatEvent[];
  loading?: boolean;
}

export function AttackFeed({ threats, loading }: AttackFeedProps) {
  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            height: "52px", marginBottom: "4px", borderRadius: "4px",
            background: "hsl(220, 18%, 12%)", opacity: 0.5,
          }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", maxHeight: "100%", scrollbarWidth: "thin" }}>
      {threats.slice(0, 50).map((threat) => (
        <div key={threat.id} className={`feed-item ${threat.severity}`} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600", color: "#e2e8f0" }}>
              <span>{countryFlag(threat.attackerCountryCode)}</span>
              <span style={{ color: "#94a3b8", fontSize: "10px", maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {threat.attackerCountry}
              </span>
              <span style={{ color: "#334155", fontSize: "9px" }}>→</span>
              <span>{countryFlag(threat.targetCountryCode)}</span>
              <span style={{ color: "#94a3b8", fontSize: "10px", maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {threat.targetCountry}
              </span>
            </div>
            <span style={{ fontSize: "9px", color: "#475569", whiteSpace: "nowrap", marginLeft: "4px" }}>
              {timeAgo(threat.timestamp)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              fontSize: "9px", padding: "1px 6px", borderRadius: "3px",
              background: `${getSeverityColor(threat.severity)}1a`,
              color: getSeverityColor(threat.severity),
              border: `1px solid ${getSeverityColor(threat.severity)}33`,
              fontWeight: "600", letterSpacing: "0.05em",
            }}>
              {threat.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: "10px", color: "#64748b" }}>{threat.attackType}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
