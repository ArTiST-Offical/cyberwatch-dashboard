import { type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: LucideIcon;
  color?: string;
  format?: boolean;
}

export function StatCard({ label, value, subLabel, icon: Icon, color = "#14b8a6", format = false }: StatCardProps) {
  const displayValue = format && typeof value === "number" ? formatNumber(value) : value;

  return (
    <div className="stat-card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <span style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
        {Icon && <Icon size={14} style={{ color: "#334155" }} />}
      </div>
      <div style={{ fontSize: "26px", fontWeight: "700", color, fontFamily: "monospace", lineHeight: 1, marginBottom: "4px" }}>
        {displayValue}
      </div>
      {subLabel && (
        <div style={{ fontSize: "10px", color: "#475569" }}>{subLabel}</div>
      )}
    </div>
  );
}
