import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { TrendingUp, Activity, Target, Globe } from "lucide-react";
import {
  useGetThreatTimeline,
  useGetThreatsByType,
  useGetTopAttackers,
  useGetTopTargets,
  useGetThreatStats,
} from "@workspace/api-client-react";
import { countryFlag, formatNumber, getSeverityColor } from "@/lib/utils";

const SEVERITY_COLORS = ["#ef4444", "#f97316", "#eab308", "#14b8a6"];

const customTooltipStyle = {
  background: "hsl(220, 18%, 9%)",
  border: "1px solid hsl(220, 15%, 16%)",
  borderRadius: "6px",
  color: "#94a3b8",
  fontSize: "11px",
};

export function Analytics() {
  const { data: timeline } = useGetThreatTimeline({ query: { refetchInterval: 60000 } });
  const { data: byType } = useGetThreatsByType({ query: { refetchInterval: 60000 } });
  const { data: topAttackers } = useGetTopAttackers({ query: { refetchInterval: 60000 } });
  const { data: topTargets } = useGetTopTargets({ query: { refetchInterval: 60000 } });
  const { data: stats } = useGetThreatStats({ query: { refetchInterval: 30000 } });

  const pieData = stats ? [
    { name: "Critical", value: stats.criticalAttacks, color: "#ef4444" },
    { name: "High", value: stats.highAttacks, color: "#f97316" },
    { name: "Medium", value: stats.mediumAttacks, color: "#eab308" },
    { name: "Low", value: stats.lowAttacks, color: "#14b8a6" },
  ] : [];

  return (
    <div style={{ padding: "16px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <TrendingUp size={16} style={{ color: "#14b8a6" }} />
        <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#e2e8f0", margin: 0 }}>Threat Analytics</h1>
        <span style={{ fontSize: "11px", color: "#334155", marginLeft: "4px" }}>Last 24 hours</span>
      </div>

      {/* Top row: Timeline + Severity Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {/* Timeline chart */}
        <div className="stat-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={11} />
            Attack Volume — Hourly
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline ?? []}>
              <defs>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
              <XAxis dataKey="hour" tick={{ fill: "#334155", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <YAxis tick={{ fill: "#334155", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <Tooltip contentStyle={customTooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#64748b" }} />
              <Area type="monotone" dataKey="count" name="Total" stroke="#14b8a6" fill="url(#totalGrad)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" fill="url(#critGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Pie */}
        <div className="stat-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
            Severity Distribution
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "8px" }}>
            {pieData.map(({ name, value, color }) => (
              <div key={name} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color, fontFamily: "monospace" }}>
                  {formatNumber(value)}
                </div>
                <div style={{ fontSize: "9px", color: "#475569" }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attack Types */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div className="stat-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
            Attack Types — Top 10
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={(byType ?? []).slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#334155", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <YAxis dataKey="attackType" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={100} stroke="hsl(220, 15%, 14%)" />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="count" name="Count" radius={[0, 2, 2, 0]}>
                {(byType ?? []).slice(0, 10).map((entry, index) => (
                  <Cell key={index} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attack type percentage list */}
        <div className="stat-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
            Attack Type Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(byType ?? []).slice(0, 8).map((type, i) => (
              <div key={type.attackType}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{type.attackType}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace" }}>
                      {formatNumber(type.count)}
                    </span>
                    <span style={{ fontSize: "10px", color: SEVERITY_COLORS[i % SEVERITY_COLORS.length], fontFamily: "monospace", minWidth: "36px", textAlign: "right" }}>
                      {type.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div style={{ height: "3px", background: "hsl(220, 18%, 14%)", borderRadius: "2px" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(type.percentage * 2, 100)}%`,
                    background: SEVERITY_COLORS[i % SEVERITY_COLORS.length],
                    borderRadius: "2px",
                    opacity: 0.8,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Top Attackers + Top Targets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="stat-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Globe size={11} style={{ color: "#f97316" }} />
            Top Attacking Nations
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(topAttackers ?? []).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
              <XAxis dataKey="countryCode" tick={{ fill: "#64748b", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <YAxis tick={{ fill: "#334155", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <Tooltip contentStyle={customTooltipStyle} formatter={(val) => [formatNumber(val as number), "Attacks"]} />
              <Bar dataKey="attackCount" name="Attacks" fill="#ef4444" opacity={0.7} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: "16px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Target size={11} style={{ color: "#14b8a6" }} />
            Most Targeted Nations
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(topTargets ?? []).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 14%)" />
              <XAxis dataKey="countryCode" tick={{ fill: "#64748b", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <YAxis tick={{ fill: "#334155", fontSize: 10 }} stroke="hsl(220, 15%, 14%)" />
              <Tooltip contentStyle={customTooltipStyle} formatter={(val) => [formatNumber(val as number), "Attacks"]} />
              <Bar dataKey="attackCount" name="Attacks" fill="#14b8a6" opacity={0.7} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
