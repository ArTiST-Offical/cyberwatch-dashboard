import { useEffect, useRef, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { getSeverityColor, countryFlag } from "@/lib/utils";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatEvent {
  id: string;
  attackerCountry: string;
  attackerCountryCode: string;
  attackerLat: number;
  attackerLng: number;
  targetCountry: string;
  targetCountryCode: string;
  targetLat: number;
  targetLng: number;
  attackType: string;
  severity: string;
  timestamp: string;
  malwareFamily?: string;
  description?: string;
  port?: number;
}

interface ArcData extends ThreatEvent {
  progress: number;
  opacity: number;
  arcKey: string;
  trailOpacity: number;
}

interface Tooltip {
  x: number;
  y: number;
  threat: ThreatEvent;
}

interface WorldMapProps {
  threats: ThreatEvent[];
  onSelectThreat?: (threat: ThreatEvent) => void;
}

// Major attacker/target country labels to show on map
const LABEL_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  US:  { lat: 39,  lng: -98,  label: "USA" },
  CN:  { lat: 36,  lng: 105,  label: "China" },
  RU:  { lat: 62,  lng: 90,   label: "Russia" },
  DE:  { lat: 51,  lng: 10,   label: "Germany" },
  GB:  { lat: 54,  lng: -3,   label: "UK" },
  FR:  { lat: 47,  lng: 2,    label: "France" },
  JP:  { lat: 36,  lng: 138,  label: "Japan" },
  KR:  { lat: 37,  lng: 128,  label: "Korea" },
  IN:  { lat: 22,  lng: 79,   label: "India" },
  BR:  { lat: -15, lng: -52,  label: "Brazil" },
  UA:  { lat: 49,  lng: 31,   label: "Ukraine" },
  KP:  { lat: 40,  lng: 127,  label: "N.Korea" },
  IR:  { lat: 33,  lng: 53,   label: "Iran" },
  NL:  { lat: 52,  lng: 5,    label: "Netherlands" },
  AU:  { lat: -28, lng: 133,  label: "Australia" },
  CA:  { lat: 58,  lng: -98,  label: "Canada" },
};

function lngLatToXY(lng: number, lat: number, width = 800, height = 400): [number, number] {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

function bezierPoint(x1: number, y1: number, x2: number, y2: number, t: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const cx = (x1 + x2) / 2 - (dy / dist) * dist * 0.35;
  const cy = (y1 + y2) / 2 + (dx / dist) * dist * 0.35;
  const bx = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
  const by = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
  return { x: bx, y: by, cx, cy };
}

const SEV_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#14b8a6",
};

function sevColor(s: string) { return SEV_COLORS[s] ?? "#14b8a6"; }

export function WorldMap({ threats, onSelectThreat }: WorldMapProps) {
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [activeCountries, setActiveCountries] = useState<{ attackers: Set<string>; targets: Set<string> }>({
    attackers: new Set(),
    targets: new Set(),
  });
  const animFrameRef = useRef<number>(0);
  const arcIndexRef = useRef(0);
  const lastAddRef = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threats.length === 0) return;
    setActiveCountries({
      attackers: new Set(threats.map(t => t.attackerCountryCode)),
      targets: new Set(threats.map(t => t.targetCountryCode)),
    });
  }, [threats]);

  useEffect(() => {
    if (threats.length === 0) return;

    const animate = () => {
      const now = Date.now();

      if (now - lastAddRef.current > 900 && threats.length > 0) {
        const threat = threats[arcIndexRef.current % threats.length];
        arcIndexRef.current++;
        lastAddRef.current = now;
        setArcs(prev => [
          ...prev.slice(-20),
          { ...threat, progress: 0, opacity: 1, arcKey: `${threat.id}-${now}`, trailOpacity: 0.35 },
        ]);
      }

      setArcs(prev =>
        prev
          .map(arc => ({
            ...arc,
            progress: Math.min(arc.progress + 0.01, 1),
            opacity: arc.progress > 0.85 ? (1 - (arc.progress - 0.85) / 0.15) : 1,
          }))
          .filter(arc => arc.opacity > 0.02)
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [threats]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGElement>, threat: ThreatEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, threat });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const W = 800, H = 400;

  return (
    <div ref={containerRef} style={{ width: "100%", background: "hsl(222, 20%, 6%)", position: "relative", overflow: "hidden" }}>

      {/* SVG overlay for arcs + labels */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 3, pointerEvents: "none" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {Object.entries(SEV_COLORS).map(([sev, color]) => (
            <filter key={sev} id={`glow-${sev}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
          <filter id="glow-white">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Arc trails */}
        {arcs.map(arc => {
          const [x1, y1] = lngLatToXY(arc.attackerLng, arc.attackerLat, W, H);
          const [x2, y2] = lngLatToXY(arc.targetLng, arc.targetLat, W, H);
          const { cx, cy } = bezierPoint(x1, y1, x2, y2, 0.5);
          const color = sevColor(arc.severity);

          return (
            <g key={arc.arcKey} opacity={arc.opacity}>
              {/* Faint trail path */}
              <path
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth="1.2"
                strokeDasharray="3 4"
                opacity={arc.trailOpacity}
              />
              {/* Animated dot */}
              {(() => {
                const pt = bezierPoint(x1, y1, x2, y2, arc.progress);
                return (
                  <>
                    <circle cx={pt.x} cy={pt.y} r="3.5" fill={color} filter={`url(#glow-${arc.severity})`} />
                    <circle cx={pt.x} cy={pt.y} r="1.5" fill="white" opacity={0.9} />
                  </>
                );
              })()}
              {/* Attacker origin pulse */}
              <circle cx={x1} cy={y1} r={4 + arc.progress * 6} fill={color} opacity={0.12 * (1 - arc.progress)} />
              <circle cx={x1} cy={y1} r="3" fill={color} opacity={0.85} filter={`url(#glow-${arc.severity})`} />
              {/* Target marker */}
              <circle cx={x2} cy={y2} r="2.5" fill="none" stroke={color} strokeWidth="1" opacity={0.6} />
              <circle cx={x2} cy={y2} r="1.5" fill={color} opacity={0.4} />
            </g>
          );
        })}

        {/* Country labels for active attackers/targets */}
        {Object.entries(LABEL_COORDS).map(([cc, { lat, lng, label }]) => {
          const [lx, ly] = lngLatToXY(lng, lat, W, H);
          const isAttacker = activeCountries.attackers.has(cc);
          const isTarget = activeCountries.targets.has(cc);
          if (!isAttacker && !isTarget) return null;
          const color = isAttacker ? "#ef444499" : "#38bdf866";
          return (
            <g key={`label-${cc}`}>
              <text x={lx} y={ly} textAnchor="middle" fontSize="8" fill={color} fontFamily="monospace" fontWeight="600" style={{ userSelect: "none" }}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Map */}
      <ComposableMap
        projection="geoEquirectangular"
        width={W}
        height={H}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="hsl(222, 18%, 12%)"
                stroke="hsl(222, 15%, 17%)"
                strokeWidth={0.4}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "hsl(222, 18%, 17%)", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Interactive arc hit-targets */}
        {arcs.map(arc => {
          const [x1, y1] = lngLatToXY(arc.attackerLng, arc.attackerLat, W, H);
          return (
            <Marker key={`hit-${arc.arcKey}`} coordinates={[arc.attackerLng, arc.attackerLat]}>
              <circle
                r={5}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent<SVGElement>, arc)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onSelectThreat?.(arc)}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: Math.min(tooltip.x + 12, (containerRef.current?.offsetWidth ?? 800) - 260),
          top: Math.max(tooltip.y - 80, 4),
          background: "hsl(222, 25%, 8%)",
          border: `1px solid ${sevColor(tooltip.threat.severity)}50`,
          borderRadius: "6px",
          padding: "10px 14px",
          zIndex: 10,
          pointerEvents: "none",
          minWidth: "230px",
          boxShadow: `0 0 20px ${sevColor(tooltip.threat.severity)}25`,
        }}>
          {/* Attack direction */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px" }}>{countryFlag(tooltip.threat.attackerCountryCode as any)}</span>
            <span style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: "700" }}>{tooltip.threat.attackerCountry}</span>
            <span style={{ color: sevColor(tooltip.threat.severity), fontSize: "14px", fontWeight: "700" }}>→</span>
            <span style={{ fontSize: "13px" }}>{countryFlag(tooltip.threat.targetCountryCode as any)}</span>
            <span style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: "700" }}>{tooltip.threat.targetCountry}</span>
          </div>

          {/* Severity + type */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
            <span style={{
              fontSize: "9px", padding: "2px 7px", borderRadius: "3px", fontWeight: "700",
              background: `${sevColor(tooltip.threat.severity)}22`,
              color: sevColor(tooltip.threat.severity),
              border: `1px solid ${sevColor(tooltip.threat.severity)}44`,
            }}>
              {tooltip.threat.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>
              {tooltip.threat.attackType}
            </span>
          </div>

          {/* IP + port */}
          {tooltip.threat.attackerIp && (
            <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace", marginBottom: "4px" }}>
              {tooltip.threat.attackerIp}{tooltip.threat.port ? `:${tooltip.threat.port}` : ""}
            </div>
          )}

          {/* Description */}
          <div style={{ fontSize: "10px", color: "#64748b", lineHeight: 1.4 }}>
            {(tooltip.threat.description ?? "").slice(0, 100)}
          </div>
        </div>
      )}

      {/* Live attack ticker at the bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(transparent, hsl(222, 20%, 6%) 80%)",
        padding: "20px 12px 10px",
        zIndex: 4,
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: "10px" }}>
            {Object.entries(SEV_COLORS).map(([sev, color]) => (
              <div key={sev} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}` }} />
                <span style={{ fontSize: "9px", color: "#475569", textTransform: "capitalize" }}>{sev}</span>
              </div>
            ))}
          </div>

          <div style={{ marginLeft: "auto", fontSize: "9px", color: "#334155", letterSpacing: "0.08em" }}>
            LIVE · FEODO TRACKER · {threats.length} BOTNET C2 EVENTS
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: "absolute", top: "8px", right: "10px",
        fontSize: "9px", color: "#1e293b", letterSpacing: "0.1em", zIndex: 4,
      }}>
        GLOBAL BOTNET C2 TELEMETRY
      </div>
    </div>
  );
}
