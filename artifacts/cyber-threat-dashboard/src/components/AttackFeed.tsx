import { countryFlag, timeAgo, getSeverityColor } from "@/lib/utils";

interface ThreatEvent {
  id: string;
  attackerCountry: string;
  attackerCountryCode: string;
  attackerIp?: string;
  targetCountry: string;
  targetCountryCode: string;
  attackType: string;
  severity: string;
  timestamp: string;
  port?: number;
  protocol?: string;
  malwareFamily?: string;
  description?: string;
}

interface AttackFeedProps {
  threats: ThreatEvent[];
  loading?: boolean;
}

export function AttackFeed({ threats, loading }: AttackFeedProps) {
  const threatList = Array.isArray(threats) ? threats : threats?.data ?? [];
  
  if (loading) {
    return (
      <div style={{ padding: "12px" }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: "56px", marginBottom: "3px", borderRadius: "4px", background: "hsl(222,18%,12%)", opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto", maxHeight: "100%", scrollbarWidth: "thin" }}>
      {threatList.slice(0, 50).map((threat) => {
        const color = getSeverityColor(threat.severity);
        return (
          <div
            key={threat.id}
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid hsl(222,15%,11%)",
              borderLeft: `2px solid ${color}55`,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "hsl(222,18%,9%)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
          >
            {/* Top row: attacker → target */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                <span style={{ fontSize: "12px" }}>{countryFlag(threat.attackerCountryCode)}</span>
                <span style={{ color: "#94a3b8", maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {threat.attackerCountry}
                </span>
                <span style={{ color, fontSize: "10px", fontWeight: "700" }}>→</span>
                <span style={{ fontSize: "12px" }}>{countryFlag(threat.targetCountryCode)}</span>
                <span style={{ color: "#94a3b8", maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {threat.targetCountry}
                </span>
              </div>
              <span style={{ fontSize: "9px", color: "#334155", whiteSpace: "nowrap", flexShrink: 0 }}>
                {timeAgo(threat.timestamp)}
              </span>
            </div>

            {/* Bottom row: severity + malware + IP:port */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{
                fontSize: "8px", padding: "1px 5px", borderRadius: "3px",
                background: `${color}1a`, color, border: `1px solid ${color}30`,
                fontWeight: "700", letterSpacing: "0.04em", flexShrink: 0,
              }}>
                {threat.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: "9px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {threat.attackType}
              </span>
              {threat.attackerIp && (
                <span style={{ marginLeft: "auto", fontSize: "8px", color: "#334155", fontFamily: "monospace", flexShrink: 0 }}>
                  {threat.attackerIp}{threat.port ? `:${threat.port}` : ""}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
