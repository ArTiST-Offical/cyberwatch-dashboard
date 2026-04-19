import { useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
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
}

interface ArcData extends ThreatEvent {
  progress: number;
  opacity: number;
  key: string;
}

interface WorldMapProps {
  threats: ThreatEvent[];
  onSelectThreat?: (threat: ThreatEvent) => void;
}

function getArcPoints(x1: number, y1: number, x2: number, y2: number, progress: number) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.3;
  const t = progress;
  const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
  const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
  return { x: bx, y: by };
}

function lngLatToXY(lng: number, lat: number): [number, number] {
  const x = ((lng + 180) / 360) * 800;
  const y = ((90 - lat) / 180) * 400;
  return [x, y];
}

export function WorldMap({ threats, onSelectThreat }: WorldMapProps) {
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [selected, setSelected] = useState<ThreatEvent | null>(null);
  const animFrameRef = useRef<number>(0);
  const arcIndexRef = useRef(0);
  const lastAddRef = useRef(Date.now());

  useEffect(() => {
    if (threats.length === 0) return;

    let frame = 0;
    const animate = () => {
      frame++;
      const now = Date.now();

      if (now - lastAddRef.current > 1200 && threats.length > 0) {
        const threat = threats[arcIndexRef.current % threats.length];
        arcIndexRef.current++;
        lastAddRef.current = now;
        setArcs(prev => [
          ...prev.slice(-15),
          { ...threat, progress: 0, opacity: 1, key: `${threat.id}-${now}` }
        ]);
      }

      setArcs(prev =>
        prev
          .map(arc => ({
            ...arc,
            progress: Math.min(arc.progress + 0.012, 1),
            opacity: arc.progress > 0.8 ? 1 - (arc.progress - 0.8) * 5 : arc.opacity,
          }))
          .filter(arc => arc.opacity > 0.05)
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [threats]);

  const handleThreatClick = (threat: ThreatEvent) => {
    setSelected(threat);
    onSelectThreat?.(threat);
  };

  return (
    <div className="map-container" style={{ width: "100%", background: "hsl(220, 22%, 7%)", position: "relative" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
        {arcs.map(arc => {
          const [x1, y1] = lngLatToXY(arc.attackerLng, arc.attackerLat);
          const [x2, y2] = lngLatToXY(arc.targetLng, arc.targetLat);
          const pt = getArcPoints(x1, y1, x2, y2, arc.progress);
          const color = getSeverityColor(arc.severity);
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.3;

          return (
            <g key={arc.key} opacity={arc.opacity}>
              <path
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth="0.8"
                strokeDasharray="4 3"
                opacity={0.4}
                transform={`scale(${800 / 800}, ${400 / 400})`}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="2.5"
                fill={color}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />
              <circle cx={x1} cy={y1} r="3" fill={color} opacity={0.7}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
              <circle cx={x2} cy={y2} r="3" fill="#ffffff" opacity={0.5} />
            </g>
          );
        })}
      </svg>

      <ComposableMap
        projection="geoEquirectangular"
        width={800}
        height={400}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <ZoomableGroup center={[0, 15]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="hsl(220, 18%, 13%)"
                  stroke="hsl(220, 15%, 18%)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "hsl(220, 18%, 18%)", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Map overlay info */}
      <div style={{
        position: "absolute", bottom: "12px", left: "12px",
        display: "flex", gap: "12px", fontSize: "10px",
      }}>
        {[
          { label: "Critical", color: "#ef4444" },
          { label: "High", color: "#f97316" },
          { label: "Medium", color: "#eab308" },
          { label: "Low", color: "#14b8a6" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ color: "#64748b" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: "absolute", top: "8px", right: "8px",
        fontSize: "9px", color: "#334155", letterSpacing: "0.08em",
      }}>
        LIVE ATTACK MAP — LAST 30 DAYS
      </div>
    </div>
  );
}
