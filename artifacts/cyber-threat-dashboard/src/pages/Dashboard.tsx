import { useState } from "react";
import { Activity, Globe2, AlertTriangle, Shield, Zap, Users } from "lucide-react";
import {
  useGetLiveThreats,
  useGetThreatStats,
  useGetTopAttackers,
  useGetTopTargets,
  useListThreats,
} from "@workspace/api-client-react";
import { WorldMap } from "@/components/WorldMap";
import { AttackFeed } from "@/components/AttackFeed";
import { StatCard } from "@/components/StatCard";
import { countryFlag, formatNumber, getSeverityColor } from "@/lib/utils";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetThreatStats({
    query: { refetchInterval: 15000 }
  });
  const { data: liveThreats } = useGetLiveThreats({
    query: { refetchInterval: 8000 }
  });
  const { data: allThreats } = useListThreats({ limit: 100 }, {
    query: { refetchInterval: 20000 }
  });
  const { data: topAttackers } = useGetTopAttackers({
    query: { refetchInterval: 30000 }
  });
  const { data: topTargets } = useGetTopTargets({
    query: { refetchInterval: 30000 }
  });

  const feedThreats = (allThreats ?? []).slice(0, 40);
  const mapThreats = allThreats ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px 24px" }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
        <StatCard
          label="Attacks / 24h"
          value={stats?.totalAttacks24h ?? 0}
          icon={Activity}
          color="#14b8a6"
          format
        />
        <StatCard
          label="Critical"
          value={stats?.criticalAttacks ?? 0}
          icon={AlertTriangle}
          color="#ef4444"
          format
        />
        <StatCard
          label="High"
          value={stats?.highAttacks ?? 0}
          icon={Zap}
          color="#f97316"
          format
        />
        <StatCard
          label="Attacks/min"
          value={stats?.attacksPerMinute?.toFixed(2) ?? "0.00"}
          subLabel="current rate"
          color="#8b5cf6"
        />
        <StatCard
          label="Unique Attackers"
          value={stats?.uniqueAttackers ?? 0}
          icon={Users}
          color="#f59e0b"
          format
        />
        <StatCard
          label="Countries Hit"
          value={stats?.totalCountriesAffected ?? 0}
          icon={Globe2}
          color="#06b6d4"
        />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
        {/* Left: Map + Bottom */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* World Map */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Globe2 size={13} style={{ color: "#334155" }} />
              <span style={{ fontSize: "11px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Global Attack Visualization
              </span>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: "10px", color: "#334155" }}>
                {mapThreats.length} attacks in view
              </span>
            </div>
            <WorldMap threats={mapThreats} />
          </div>

          {/* Bottom row: Top Attackers + Top Targets */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="stat-card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                Top Attacking Nations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(topAttackers ?? []).slice(0, 5).map((attacker, i) => (
                  <div key={attacker.countryCode} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#334155", width: "16px" }}>{i + 1}</span>
                    <span style={{ fontSize: "13px" }}>{countryFlag(attacker.countryCode)}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", flex: 1 }}>{attacker.country}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: `${Math.max(attacker.percentage * 1.5, 4)}px`,
                        height: "3px", borderRadius: "2px",
                        background: `linear-gradient(to right, #ef4444, #f97316)`,
                        minWidth: "4px",
                      }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", minWidth: "36px", textAlign: "right" }}>
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
                {(topTargets ?? []).slice(0, 5).map((target, i) => (
                  <div key={target.countryCode} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#334155", width: "16px" }}>{i + 1}</span>
                    <span style={{ fontSize: "13px" }}>{countryFlag(target.countryCode)}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", flex: 1 }}>{target.country}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: `${Math.max(target.percentage * 1.5, 4)}px`,
                        height: "3px", borderRadius: "2px",
                        background: `linear-gradient(to right, #14b8a6, #06b6d4)`,
                        minWidth: "4px",
                      }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", minWidth: "36px", textAlign: "right" }}>
                        {formatNumber(target.attackCount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Feed + Ad */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Ad slot */}
          <div className="ad-zone" style={{ height: "270px", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "18px" }}>
            <span style={{ fontSize: "11px", color: "#1e293b", textAlign: "center" }}>
              Google AdSense<br />300 × 250
            </span>
          </div>

          {/* Live feed */}
          <div className="stat-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid hsl(220, 15%, 14%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div className="live-dot" style={{
                  width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444"
                }} />
                <span style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Live Attack Feed
                </span>
                <span style={{ marginLeft: "auto", fontSize: "10px", color: "#334155" }}>
                  {feedThreats.length} events
                </span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <AttackFeed threats={feedThreats} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
