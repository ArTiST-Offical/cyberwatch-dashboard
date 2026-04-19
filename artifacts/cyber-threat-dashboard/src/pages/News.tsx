import { useState } from "react";
import { ExternalLink, Clock, Tag, AlertTriangle, Rss, Shield, Bug, Globe } from "lucide-react";
import { useListCyberNews, useGetTrendingThreats } from "@workspace/api-client-react";
import { getSeverityColor, timeAgo, countryFlag } from "@/lib/utils";

const CATEGORIES = ["All", "Ransomware", "APT", "Vulnerability", "Data Breach", "Phishing", "Malware", "DDoS", "Supply Chain", "General"];

const SOURCE_COLORS: Record<string, string> = {
  "The Hacker News": "#14b8a6",
  "BleepingComputer": "#f97316",
  "SecurityWeek": "#8b5cf6",
  "Krebs on Security": "#ef4444",
  "Dark Reading": "#06b6d4",
  "Cybersecurity News": "#eab308",
};

function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] ?? "#475569";
  return (
    <span style={{
      fontSize: "9px", padding: "2px 7px", borderRadius: "3px",
      background: `${color}18`, color, border: `1px solid ${color}35`,
      fontWeight: "700", letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      {source}
    </span>
  );
}

function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity || severity === "info") return null;
  const color = getSeverityColor(severity);
  return (
    <span style={{
      fontSize: "9px", padding: "2px 7px", borderRadius: "3px",
      background: `${color}18`, color,
      border: `1px solid ${color}35`, fontWeight: "700",
    }}>
      {severity.toUpperCase()}
    </span>
  );
}

export function News() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: articles, isLoading } = useListCyberNews(
    { limit: 60, ...(selectedCategory && selectedCategory !== "All" ? { category: selectedCategory } : {}) },
    { query: { refetchInterval: 120000 } }
  );

  const { data: trending } = useGetTrendingThreats({ query: { refetchInterval: 120000 } });

  const categoryCount = (articles ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 290px", gap: "14px", padding: "14px 20px" }}>

      {/* Left: Category Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div className="stat-card" style={{ padding: "14px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Categories
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat;
              const cnt = cat === "All" ? (articles ?? []).length : (categoryCount[cat] ?? 0);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    textAlign: "left", background: isActive ? "rgba(20,184,166,0.08)" : "transparent",
                    border: "none", borderRadius: "4px", padding: "6px 10px",
                    color: isActive ? "#14b8a6" : "#64748b",
                    fontSize: "11px", cursor: "pointer",
                    fontWeight: isActive ? "600" : "400",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <span>{cat}</span>
                  {cnt > 0 && <span style={{ fontSize: "9px", color: isActive ? "#14b8a6" : "#334155" }}>{cnt}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sources legend */}
        <div className="stat-card" style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Sources
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Object.entries(SOURCE_COLORS).map(([src, color]) => (
              <div key={src} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: "10px", color: "#475569" }}>{src}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ad-zone" style={{ height: "250px", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "18px" }}>
          <span style={{ fontSize: "10px", color: "#1e293b", textAlign: "center" }}>Google AdSense<br />160 × 600</span>
        </div>
      </div>

      {/* Main: Articles */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Rss size={14} style={{ color: "#14b8a6" }} />
          <h1 style={{ fontSize: "15px", fontWeight: "700", color: "#e2e8f0", margin: 0 }}>Threat Intelligence Feed</h1>
          <span style={{ fontSize: "10px", color: "#334155", marginLeft: "auto" }}>
            {(articles ?? []).length} articles · live RSS
          </span>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="stat-card" style={{ padding: "14px", height: "90px", opacity: 0.4 }} />
            ))}
          </div>
        ) : (articles ?? []).length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#334155", fontSize: "13px" }}>
            No articles in this category yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(articles ?? []).map(article => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div className="stat-card" style={{
                  padding: "14px",
                  transition: "border-color 0.15s, background 0.15s",
                  cursor: "pointer",
                  display: "grid",
                  gridTemplateColumns: article.imageUrl ? "90px 1fr" : "1fr",
                  gap: "12px",
                  alignItems: "start",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#14b8a622"; (e.currentTarget as HTMLDivElement).style.background = "hsl(222,18%,9%)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ""; (e.currentTarget as HTMLDivElement).style.background = ""; }}
                >
                  {/* Thumbnail */}
                  {article.imageUrl && (
                    <div style={{ overflow: "hidden", borderRadius: "4px", height: "60px", background: "hsl(222,18%,12%)" }}>
                      <img
                        src={article.imageUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                      />
                    </div>
                  )}

                  <div>
                    {/* Meta row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <SourceBadge source={article.source} />
                      <span style={{
                        fontSize: "9px", padding: "2px 6px", borderRadius: "3px",
                        background: "rgba(99,102,241,0.1)", color: "#818cf8",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}>{article.category}</span>
                      <SeverityBadge severity={article.severity} />
                      <span style={{ fontSize: "9px", color: "#334155", marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                        <Clock size={9} />{timeAgo(article.publishedAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", margin: "0 0 5px", lineHeight: 1.4 }}>
                      {article.title}
                    </h3>

                    {/* Summary */}
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {article.summary}
                    </p>

                    {/* Tags + countries + link */}
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                      {article.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{
                          fontSize: "9px", padding: "1px 6px", borderRadius: "3px",
                          background: "hsl(222,18%,12%)", color: "#475569",
                          border: "1px solid hsl(222,15%,17%)",
                          display: "flex", alignItems: "center", gap: "2px",
                        }}>
                          <Tag size={7} />{tag}
                        </span>
                      ))}
                      {article.relatedCountries?.slice(0, 3).map(cc => (
                        <span key={cc} style={{ fontSize: "12px" }}>{countryFlag(cc as any)}</span>
                      ))}
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", color: "#14b8a6", fontSize: "10px" }}>
                        <ExternalLink size={10} /> Read full article
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Right: Trending / CVEs / Actors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* Active Campaigns (real news-based) */}
        {trending?.activeCampaigns && trending.activeCampaigns.length > 0 && (
          <div className="stat-card" style={{ padding: "13px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="live-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444" }} />
              Active Campaigns
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {trending.activeCampaigns.map((campaign, i) => (
                <div key={i} style={{ fontSize: "10px", color: "#94a3b8", lineHeight: 1.4, paddingLeft: "10px", borderLeft: "2px solid #ef444433" }}>
                  {campaign}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real CVEs from NVD */}
        <div className="stat-card" style={{ padding: "13px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Bug size={11} style={{ color: "#f97316" }} />
            Recent CVEs — NVD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {(trending?.recentCves ?? []).length === 0 ? (
              <div style={{ fontSize: "10px", color: "#334155" }}>Loading from NVD...</div>
            ) : (trending?.recentCves ?? []).map(cve => (
              <a
                key={cve.cveId}
                href={`https://nvd.nist.gov/vuln/detail/${cve.cveId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div style={{ padding: "8px 10px", background: "hsl(222,18%,7%)", borderRadius: "5px", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "hsl(222,18%,9%)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "hsl(222,18%,7%)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#14b8a6", fontFamily: "monospace" }}>
                      {cve.cveId}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {cve.exploitAvailable && (
                        <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontWeight: "700" }}>
                          EXPLOIT
                        </span>
                      )}
                      <span style={{
                        fontSize: "12px", fontWeight: "700", fontFamily: "monospace",
                        color: cve.cvssScore >= 9 ? "#ef4444" : cve.cvssScore >= 7 ? "#f97316" : "#eab308",
                      }}>
                        {cve.cvssScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "9px", color: "#64748b", marginBottom: "3px", fontWeight: "500" }}>
                    {cve.affectedSoftware}
                  </div>
                  <div style={{ fontSize: "9px", color: "#334155", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cve.description}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Threat Actors */}
        <div className="stat-card" style={{ padding: "13px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={11} style={{ color: "#f97316" }} />
            Active Threat Actors
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(trending?.threatActors ?? []).map(actor => (
              <div key={actor.name} style={{ padding: "9px 10px", background: "hsl(222,18%,7%)", borderRadius: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#e2e8f0" }}>{actor.name}</span>
                  <span style={{
                    fontSize: "8px", padding: "1px 6px", borderRadius: "3px", fontWeight: "700",
                    background: `${getSeverityColor(actor.threatLevel)}1a`,
                    color: getSeverityColor(actor.threatLevel),
                    border: `1px solid ${getSeverityColor(actor.threatLevel)}30`,
                  }}>
                    {actor.threatLevel.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "9px", color: "#475569", marginBottom: "3px" }}>
                  {countryFlag(actor.originCountry.toUpperCase().slice(0, 2) as any)} {actor.originCountry} · {actor.motivation}
                </div>
                <div style={{ fontSize: "9px", color: "#334155", lineHeight: 1.4 }}>
                  {actor.recentActivity.slice(0, 80)}{actor.recentActivity.length > 80 ? "..." : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
