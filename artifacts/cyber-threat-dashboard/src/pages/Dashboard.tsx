import { useState } from "react";
import { Activity, Globe2, AlertTriangle, Shield, Zap, Users, ExternalLink } from "lucide-react";
import {
  useGetLiveThreats,
  useGetThreatStats,
  useGetTopAttackers,
  useGetTopTargets,
  useListCyberNews,
} from "@workspace/api-client-react";
import { WorldMap } from "@/components/WorldMap";
import { AttackFeed } from "@/components/AttackFeed";
import { StatCard } from "@/components/StatCard";
import { countryFlag, formatNumber, getSeverityColor, timeAgo } from "@/lib/utils";

export function Dashboard() {
  const { data: stats } = useGetThreatStats({
    query: { refetchInterval: 15000 }
  });
  const { data: liveThreats, isLoading: liveLoading } = useGetLiveThreats({
    query: { refetchInterval: 10000 }
  });
  const { data: topAttackers } = useGetTopAttackers({
    query: { refetchInterval: 30000 }
  });
  const { data: topTargets } = useGetTopTargets({
    query: { refetchInterval: 30000 }
  });
  const { data: latestNews } = useListCyberNews({ limit: 4 }, {
    query: { refetchInterval: 120000 }
  });

  const threats = liveThreats ?? [];
  const attackers = Array.isArray(topAttackers) ? topAttackers : topAttackers?.data ?? [];
  const targets = Array.isArray(topTargets) ? topTargets : topTargets?.data ?? [];
  const news = Array.isArray(latestNews) ? latestNews : latestNews?.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "14px 20px" }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px" }}>
        <StatCard label="Active C2 Servers" value={stats?.totalAttacks24h ?? 0} icon={Activity} color="#14b8a6" format />
        <StatCard label="Critical" value={stats?.criticalAttacks ?? 0} icon={AlertTriangle} color="#ef4444" format />
        <StatCard label="High" value={stats?.highAttacks ?? 0} icon={Zap} color="#f97316" format />
        <StatCard label="Events/min" value={stats?.attacksPerMinute?.toFixed(2) ?? "0.00"} subLabel="current rate" color="#8b5cf6" />
        <StatCard label="Nations Attacking" value={stats?.uniqueAttackers ?? 0} icon={Users} color="#f59e0b" format />
        <StatCard label="Nations Targeted" value={stats?.totalCountriesAffected ?? 0} icon={Globe2} color="#06b6d4" />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "14px" }}>
        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* World Map */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Globe2 size={12} style={{ color: "#334155" }} />
              <span style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Global Attack Visualization
              </span>
              <div style={{ flex: 1 }} />
              {threats.length > 0 && (
                <span style={{ fontSize: "9px", color: "#334155", fontFamily: "monospace" }}>
                  {threats.length} botnet C2 servers active
                </span>
              )}
            </div>
            <div style={{ border: "1px solid hsl(222,18%,14%)", borderRadius: "6px", overflow: "hidden" }}>
              <WorldMap threats={threats} />
            </div>
          </div>

          {/* Bottom row: Top Attackers + Top Targets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="stat-card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                Top Attacking Nations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {attackers.slice(0, 5).map((attacker, i) => (
                  <div key={attacker.countryCode} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#334155", width: "14px", fontFamily: "monospace" }}>{i + 1}</span>
                    <span style={{ fontSize: "13px" }}>{countryFlag(attacker.countryCode)}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attacker.country}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: `${Math.max(attacker.percentage * 1.8, 4)}px`,
                        height: "3px", borderRadius: "2px",
                        background: "linear-gradient(to right, #ef4444, #f97316)",
                        minWidth: "4px",
                      }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", minWidth: "32px", textAlign: "right" }}>
                        {formatNumber(attacker.attackCount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stat-card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                Most Targeted Nations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {targets.slice(0, 5).map((target, i) => (
                  <div key={target.countryCode} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#334155", width: "14px", fontFamily: "monospace" }}>{i + 1}</span>
                    <span style={{ fontSize: "13px" }}>{countryFlag(target.countryCode)}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{target.country}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: `${Math.max(target.percentage * 1.8, 4)}px`,
                        height: "3px", borderRadius: "2px",
                        background: "linear-gradient(to right, #14b8a6, #06b6d4)",
                        minWidth: "4px",
                      }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", minWidth: "32px", textAlign: "right" }}>
                        {formatNumber(target.attackCount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latest News teaser */}
          {news && news.length > 0 && (
            <div className="stat-card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Latest Threat Intel
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {news.slice(0, 3).map(article => (
                  <div key={article.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    {article.imageUrl && (
                      <img src={article.imageUrl} alt="" style={{ width: "44px", height: "32px", objectFit: "cover", borderRadius: "3px", flexShrink: 0, border: "1px solid hsl(222,18%,16%)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <div style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "500", lineHeight: 1.4, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {article.title}
                        </div>
                      </a>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{ fontSize: "9px", color: "#475569" }}>{article.source}</span>
                        <span style={{ fontSize: "9px", color: "#334155" }}>·</span>
                        <span style={{ fontSize: "9px", color: "#334155" }}>{timeAgo(article.publishedAt)}</span>
                        {article.severity && (
                          <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "2px", background: `${getSeverityColor(article.severity)}1a`, color: getSeverityColor(article.severity), fontWeight: "700" }}>
                            {article.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: "#475569", flexShrink: 0 }}>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col: Ad + Live Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="ad-zone" style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "18px" }}>
            <span style={{ fontSize: "11px", color: "#1e293b", textAlign: "center" }}>
              Google AdSense<br />300 × 250
            </span>
          </div>

          <div className="stat-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid hsl(222, 15%, 14%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="live-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Live Attack Feed
                </span>
                <span style={{ marginLeft: "auto", fontSize: "9px", color: "#334155", fontFamily: "monospace" }}>
                  {threats.length} events
                </span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <AttackFeed threats={threats} loading={liveLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
