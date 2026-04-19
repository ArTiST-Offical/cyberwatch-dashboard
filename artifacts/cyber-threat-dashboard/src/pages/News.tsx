import { useState } from "react";
import { ExternalLink, Clock, Tag, AlertTriangle, Rss } from "lucide-react";
import { useListCyberNews, useGetTrendingThreats } from "@workspace/api-client-react";
import { getSeverityColor, timeAgo, formatDate, countryFlag } from "@/lib/utils";

const CATEGORIES = ["Ransomware", "APT", "Vulnerability", "Data Breach", "Phishing", "Malware", "Critical Infrastructure"];

export function News() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: articles, isLoading } = useListCyberNews(
    { limit: 50, ...(selectedCategory ? { category: selectedCategory } : {}) },
    { query: { refetchInterval: 60000 } }
  );

  const { data: trending } = useGetTrendingThreats({
    query: { refetchInterval: 60000 }
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 300px", gap: "16px", padding: "16px 24px" }}>
      {/* Sidebar: Category Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="stat-card" style={{ padding: "14px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Categories
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <button
              onClick={() => setSelectedCategory("")}
              style={{
                textAlign: "left", background: selectedCategory === "" ? "rgba(20, 184, 166, 0.08)" : "none",
                border: "none", borderRadius: "4px", padding: "7px 10px",
                color: selectedCategory === "" ? "#14b8a6" : "#64748b",
                fontSize: "12px", cursor: "pointer", fontWeight: selectedCategory === "" ? "600" : "400",
              }}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  textAlign: "left",
                  background: selectedCategory === cat ? "rgba(20, 184, 166, 0.08)" : "none",
                  border: "none", borderRadius: "4px", padding: "7px 10px",
                  color: selectedCategory === cat ? "#14b8a6" : "#64748b",
                  fontSize: "12px", cursor: "pointer", fontWeight: selectedCategory === cat ? "600" : "400",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Ad slot */}
        <div className="ad-zone" style={{ height: "250px", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "18px" }}>
          <span style={{ fontSize: "10px", color: "#1e293b", textAlign: "center" }}>
            Google AdSense<br />160 × 600
          </span>
        </div>
      </div>

      {/* Main: Articles */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Rss size={14} style={{ color: "#14b8a6" }} />
          <h1 style={{ fontSize: "16px", fontWeight: "700", color: "#e2e8f0", margin: 0 }}>Threat Intelligence Feed</h1>
          {selectedCategory && (
            <span style={{
              fontSize: "10px", padding: "2px 8px", borderRadius: "10px",
              background: "rgba(20, 184, 166, 0.1)", color: "#14b8a6",
              border: "1px solid rgba(20, 184, 166, 0.2)", marginLeft: "4px",
            }}>
              {selectedCategory}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="stat-card" style={{ padding: "16px", height: "100px", opacity: 0.5 }} />
            ))
          ) : (articles ?? []).map(article => (
            <div key={article.id} className="stat-card" style={{ padding: "16px", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  {/* Source + Category + Severity */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "600" }}>{article.source}</span>
                    <span style={{
                      fontSize: "9px", padding: "1px 6px", borderRadius: "3px",
                      background: "rgba(99, 102, 241, 0.1)", color: "#818cf8",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                    }}>
                      {article.category}
                    </span>
                    {article.severity && (
                      <span style={{
                        fontSize: "9px", padding: "1px 6px", borderRadius: "3px",
                        background: `${getSeverityColor(article.severity)}1a`,
                        color: getSeverityColor(article.severity),
                        border: `1px solid ${getSeverityColor(article.severity)}30`,
                        fontWeight: "700",
                      }}>
                        {article.severity.toUpperCase()}
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "#334155", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={10} />
                      {timeAgo(article.publishedAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0", margin: "0 0 6px", lineHeight: 1.4 }}>
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {article.summary}
                  </p>

                  {/* Tags + Countries */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {article.tags.slice(0, 4).map(tag => (
                      <span key={tag} style={{
                        fontSize: "10px", padding: "2px 7px", borderRadius: "3px",
                        background: "hsl(220, 18%, 12%)", color: "#475569",
                        border: "1px solid hsl(220, 15%, 18%)",
                        display: "flex", alignItems: "center", gap: "3px",
                      }}>
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                    {article.relatedCountries && article.relatedCountries.slice(0, 3).map(cc => (
                      <span key={cc} style={{ fontSize: "12px" }}>
                        {countryFlag(cc)}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    color: "#14b8a6", fontSize: "11px", textDecoration: "none",
                    padding: "6px 10px", borderRadius: "4px",
                    border: "1px solid rgba(20, 184, 166, 0.2)",
                    background: "rgba(20, 184, 166, 0.05)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <ExternalLink size={11} />
                  Read
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Trending Threats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Threat Actors */}
        <div className="stat-card" style={{ padding: "14px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={11} style={{ color: "#f97316" }} />
            Active Threat Actors
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(trending?.threatActors ?? []).map(actor => (
              <div key={actor.name} style={{ padding: "10px", background: "hsl(220, 18%, 7%)", borderRadius: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#e2e8f0" }}>{actor.name}</span>
                  <span style={{
                    fontSize: "9px", padding: "1px 6px", borderRadius: "3px",
                    background: `${getSeverityColor(actor.threatLevel)}1a`,
                    color: getSeverityColor(actor.threatLevel),
                    border: `1px solid ${getSeverityColor(actor.threatLevel)}30`,
                  }}>
                    {actor.threatLevel.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "#475569", marginBottom: "4px" }}>
                  {countryFlag(actor.originCountry.toUpperCase().slice(0, 2) as any)} {actor.originCountry} · {actor.motivation.slice(0, 40)}...
                </div>
                <div style={{ fontSize: "10px", color: "#334155" }}>
                  {actor.recentActivity.slice(0, 60)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CVE List */}
        <div className="stat-card" style={{ padding: "14px" }}>
          <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Recent CVEs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(trending?.recentCves ?? []).map(cve => (
              <div key={cve.cveId} style={{ padding: "8px 10px", background: "hsl(220, 18%, 7%)", borderRadius: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#14b8a6", fontFamily: "monospace" }}>
                    {cve.cveId}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {cve.exploitAvailable && (
                      <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        EXPLOIT
                      </span>
                    )}
                    <span style={{
                      fontSize: "11px", fontWeight: "700", fontFamily: "monospace",
                      color: cve.cvssScore >= 9 ? "#ef4444" : cve.cvssScore >= 7 ? "#f97316" : "#eab308",
                    }}>
                      {cve.cvssScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "10px", color: "#475569" }}>{cve.affectedSoftware}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        {trending?.activeCampaigns && trending.activeCampaigns.length > 0 && (
          <div className="stat-card" style={{ padding: "14px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
              Active Campaigns
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {trending.activeCampaigns.map((campaign, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                  <div className="live-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                  <span style={{ color: "#94a3b8" }}>{campaign}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
