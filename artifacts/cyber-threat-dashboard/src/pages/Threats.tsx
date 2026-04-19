import { useState } from "react";
import { Filter, ChevronDown, AlertCircle, RefreshCw } from "lucide-react";
import { useListThreats } from "@workspace/api-client-react";
import { getSeverityColor, countryFlag, timeAgo, formatNumber } from "@/lib/utils";

const ATTACK_TYPES = [
  "DDoS", "SQL Injection", "Phishing", "Ransomware", "Brute Force",
  "Zero-Day Exploit", "Man-in-the-Middle", "Supply Chain", "APT Intrusion",
  "Cryptojacking", "DNS Hijacking", "Port Scan", "Malware Injection",
  "Credential Theft", "Social Engineering"
];

const SEVERITIES = ["critical", "high", "medium", "low"];

export function Threats() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  const { data: threats, isLoading, refetch } = useListThreats(
    {
      limit: 200,
      ...(selectedSeverity ? { severity: selectedSeverity as "critical" | "high" | "medium" | "low" } : {}),
      ...(selectedType ? { attackType: selectedType } : {}),
    },
    { query: { refetchInterval: 30000 } }
  );

  return (
    <div style={{ padding: "16px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#e2e8f0", margin: 0 }}>Threat Events</h1>
          <p style={{ fontSize: "11px", color: "#475569", margin: "2px 0 0" }}>
            Real-time cyber attack log — {threats?.length ?? 0} events displayed
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => refetch()}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 15%, 18%)",
            color: "#64748b", borderRadius: "4px", padding: "6px 12px",
            cursor: "pointer", fontSize: "12px",
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: "12px", marginBottom: "16px",
        padding: "12px 16px", background: "hsl(220, 18%, 9%)",
        border: "1px solid hsl(220, 15%, 14%)", borderRadius: "6px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={12} style={{ color: "#475569" }} />
          <span style={{ fontSize: "11px", color: "#475569" }}>Filter:</span>
        </div>

        <select
          value={selectedSeverity}
          onChange={e => setSelectedSeverity(e.target.value)}
          style={{
            background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 15%, 18%)",
            color: "#94a3b8", borderRadius: "4px", padding: "4px 8px",
            fontSize: "11px", cursor: "pointer",
          }}
        >
          <option value="">All Severities</option>
          {SEVERITIES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          style={{
            background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 15%, 18%)",
            color: "#94a3b8", borderRadius: "4px", padding: "4px 8px",
            fontSize: "11px", cursor: "pointer",
          }}
        >
          <option value="">All Attack Types</option>
          {ATTACK_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {(selectedSeverity || selectedType) && (
          <button
            onClick={() => { setSelectedSeverity(""); setSelectedType(""); }}
            style={{
              background: "none", border: "1px solid hsl(220, 15%, 18%)",
              color: "#64748b", borderRadius: "4px", padding: "4px 10px",
              cursor: "pointer", fontSize: "11px",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="stat-card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(220, 15%, 14%)" }}>
                {["Severity", "Attack Type", "Attacker", "Target", "Technique", "MITRE Tactic", "Port/Protocol", "Timestamp"].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: "left",
                    fontSize: "10px", color: "#475569", fontWeight: "600",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    background: "hsl(220, 18%, 9%)", whiteSpace: "nowrap",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} style={{ padding: "12px", background: "hsl(220, 18%, 10%)" }}>
                      <div style={{ height: "14px", background: "hsl(220, 18%, 14%)", borderRadius: "3px", opacity: 0.5 }} />
                    </td>
                  </tr>
                ))
              ) : (threats ?? []).map(threat => (
                <tr key={threat.id} className="table-row" style={{ borderBottom: "1px solid hsl(220, 15%, 11%)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: "9px", padding: "2px 7px", borderRadius: "3px",
                      background: `${getSeverityColor(threat.severity)}1a`,
                      color: getSeverityColor(threat.severity),
                      border: `1px solid ${getSeverityColor(threat.severity)}30`,
                      fontWeight: "700", letterSpacing: "0.06em",
                    }}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#e2e8f0", fontWeight: "500" }}>
                    {threat.attackType}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>{countryFlag(threat.attackerCountryCode)}</span>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: "11px" }}>{threat.attackerCountry}</div>
                        {threat.attackerIp && (
                          <div style={{ color: "#334155", fontSize: "10px", fontFamily: "monospace" }}>
                            {threat.attackerIp}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>{countryFlag(threat.targetCountryCode)}</span>
                      <div>
                        <div style={{ color: "#94a3b8", fontSize: "11px" }}>{threat.targetCountry}</div>
                        {threat.targetIp && (
                          <div style={{ color: "#334155", fontSize: "10px", fontFamily: "monospace" }}>
                            {threat.targetIp}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "11px", maxWidth: "160px" }}>
                    {threat.technique ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {threat.mitreTactic ? (
                      <span style={{
                        fontSize: "10px", padding: "2px 7px", borderRadius: "3px",
                        background: "rgba(139, 92, 246, 0.1)", color: "#a78bfa",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                      }}>
                        {threat.mitreTactic}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "11px", fontFamily: "monospace" }}>
                    {threat.port ? `${threat.port}/${threat.protocol ?? "TCP"}` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#475569", fontSize: "10px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {timeAgo(threat.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
