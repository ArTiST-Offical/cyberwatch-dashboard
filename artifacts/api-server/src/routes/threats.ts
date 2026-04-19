import { Router, type IRouter } from "express";
import { db, threatEventsTable, threatActorsTable } from "@workspace/db";
import { desc, gte, sql, eq, and, count } from "drizzle-orm";
import {
  ListThreatsQueryParams,
  GetThreatStatsResponse,
  GetTopAttackersResponseItem,
  GetTopTargetsResponseItem,
  GetThreatsByTypeResponseItem,
  GetThreatTimelineResponseItem,
  ListThreatsResponseItem,
  GetLiveThreatsResponseItem,
  ListCyberNewsQueryParams,
  ListCyberNewsResponseItem,
  GetTrendingThreatsResponse,
} from "@workspace/api-zod";
import { fetchFeodoThreats, fetchKevThreats, fetchRealNews, fetchRecentCves } from "../lib/realData";

const router: IRouter = Router();

function formatThreatEvent(event: typeof threatEventsTable.$inferSelect) {
  return {
    id: event.externalId,
    timestamp: event.timestamp.toISOString(),
    attackerCountry: event.attackerCountry,
    attackerCountryCode: event.attackerCountryCode,
    attackerIp: event.attackerIp ?? undefined,
    attackerLat: event.attackerLat,
    attackerLng: event.attackerLng,
    targetCountry: event.targetCountry,
    targetCountryCode: event.targetCountryCode,
    targetIp: event.targetIp ?? undefined,
    targetLat: event.targetLat,
    targetLng: event.targetLng,
    attackType: event.attackType,
    severity: event.severity as "critical" | "high" | "medium" | "low",
    port: event.port ?? undefined,
    protocol: event.protocol ?? undefined,
    description: event.description ?? undefined,
    technique: event.technique ?? undefined,
    mitreTactic: event.mitreTactic ?? undefined,
  };
}

// /threats — seeded DB (historical data)
router.get("/threats", async (req, res): Promise<void> => {
  const parsed = ListThreatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, attackType, severity } = parsed.data;
  const conditions = [];
  if (attackType) conditions.push(eq(threatEventsTable.attackType, attackType));
  if (severity) conditions.push(eq(threatEventsTable.severity, severity));

  const threats = await db
    .select()
    .from(threatEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(threatEventsTable.timestamp))
    .limit(limit);

  res.json(threats.map(formatThreatEvent).map(e => ListThreatsResponseItem.parse(e)));
});

// /threats/live — REAL DATA: Feodo Tracker C2s + CISA KEV active exploits
router.get("/threats/live", async (_req, res): Promise<void> => {
  const [feodoThreats, kevThreats] = await Promise.all([
    fetchFeodoThreats(),
    fetchKevThreats(),
  ]);

  // Combine: Feodo C2s first (confirmed botnet), then KEV (active exploits)
  const combined = [
    ...feodoThreats,
    ...kevThreats,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Return latest 60 events, most recent first
  const live = combined.slice(0, 60).map(t => ({
    id: t.id,
    timestamp: t.timestamp,
    attackerCountry: t.attackerCountry,
    attackerCountryCode: t.attackerCountryCode,
    attackerIp: t.attackerIp,
    attackerLat: t.attackerLat,
    attackerLng: t.attackerLng,
    targetCountry: t.targetCountry,
    targetCountryCode: t.targetCountryCode,
    targetLat: t.targetLat,
    targetLng: t.targetLng,
    attackType: t.attackType,
    severity: t.severity as "critical" | "high" | "medium" | "low",
    port: t.port,
    protocol: t.protocol,
    description: t.description,
    technique: t.technique,
    mitreTactic: t.mitreTactic,
  }));

  res.json(live.map(e => GetLiveThreatsResponseItem.parse(e)));
});

// /threats/stats — aggregated from Feodo + CISA KEV
router.get("/threats/stats", async (_req, res): Promise<void> => {
  const [feodoThreats, kevThreats] = await Promise.all([fetchFeodoThreats(), fetchKevThreats()]);
  const allThreats = [...feodoThreats, ...kevThreats];

  const total = allThreats.length;
  const critical = allThreats.filter(t => t.severity === "critical").length;
  const high = allThreats.filter(t => t.severity === "high").length;
  const medium = allThreats.filter(t => t.severity === "medium").length;
  const low = allThreats.filter(t => t.severity === "low").length;

  const uniqueAttackers = new Set(allThreats.map(t => t.attackerCountryCode)).size;
  const uniqueTargets = new Set(allThreats.map(t => t.targetCountryCode)).size;
  const allCountries = new Set([
    ...allThreats.map(t => t.attackerCountryCode),
    ...allThreats.map(t => t.targetCountryCode),
  ]).size;

  const malwareCounts = allThreats.reduce<Record<string, number>>((acc, t) => {
    const key = t.malwareFamily ?? t.attackType;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const mostCommonAttackType = Object.entries(malwareCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Malware C2";

  const attacksPerMinute = parseFloat((total / (30 * 24 * 60)).toFixed(2));

  res.json(GetThreatStatsResponse.parse({
    totalAttacks24h: total,
    criticalAttacks: critical,
    highAttacks: high,
    mediumAttacks: medium,
    lowAttacks: low,
    attacksPerMinute,
    uniqueAttackers,
    uniqueTargets,
    mostCommonAttackType,
    totalCountriesAffected: allCountries,
  }));
});

// /threats/top-attackers — from Feodo + CISA KEV combined
router.get("/threats/top-attackers", async (_req, res): Promise<void> => {
  const [feodoThreats, kevThreats] = await Promise.all([fetchFeodoThreats(), fetchKevThreats()]);
  const feodoThreats2 = [...feodoThreats, ...kevThreats];

  const countryMap = feodoThreats2.reduce<Record<string, { name: string; count: number; malwares: Set<string> }>>((acc, t) => {
    const cc = t.attackerCountryCode;
    if (!acc[cc]) acc[cc] = { name: t.attackerCountry, count: 0, malwares: new Set() };
    acc[cc].count++;
    if (t.malwareFamily) acc[cc].malwares.add(t.malwareFamily);
    return acc;
  }, {});

  const total = feodoThreats2.length || 1;
  const result = Object.entries(countryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([cc, data]) => ({
      country: data.name,
      countryCode: cc,
      attackCount: data.count,
      percentage: parseFloat(((data.count / total) * 100).toFixed(1)),
      topAttackTypes: Array.from(data.malwares).slice(0, 3),
    }));

  res.json(result.map(r => GetTopAttackersResponseItem.parse(r)));
});

// /threats/top-targets — from Feodo + CISA KEV combined
router.get("/threats/top-targets", async (_req, res): Promise<void> => {
  const [feodoThreats, kevThreats] = await Promise.all([fetchFeodoThreats(), fetchKevThreats()]);
  const allThreats2 = [...feodoThreats, ...kevThreats];

  const countryMap = allThreats2.reduce<Record<string, { name: string; count: number; malwares: Set<string> }>>((acc, t) => {
    const cc = t.targetCountryCode;
    if (!acc[cc]) acc[cc] = { name: t.targetCountry, count: 0, malwares: new Set() };
    acc[cc].count++;
    if (t.malwareFamily) acc[cc].malwares.add(t.malwareFamily);
    return acc;
  }, {});

  const total = allThreats2.length || 1;
  const result = Object.entries(countryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([cc, data]) => ({
      country: data.name,
      countryCode: cc,
      attackCount: data.count,
      percentage: parseFloat(((data.count / total) * 100).toFixed(1)),
      topAttackTypes: Array.from(data.malwares).slice(0, 3),
    }));

  res.json(result.map(r => GetTopTargetsResponseItem.parse(r)));
});

// /threats/by-type — from Feodo + CISA KEV combined
router.get("/threats/by-type", async (_req, res): Promise<void> => {
  const [feodoRaw, kevRaw] = await Promise.all([fetchFeodoThreats(), fetchKevThreats()]);
  const byTypeThreats = [...feodoRaw, ...kevRaw];

  const typeMap = byTypeThreats.reduce<Record<string, { count: number; bySeverity: Record<string, number> }>>((acc, t) => {
    const type = t.malwareFamily ?? t.attackType;
    if (!acc[type]) acc[type] = { count: 0, bySeverity: { critical: 0, high: 0, medium: 0, low: 0 } };
    acc[type].count++;
    acc[type].bySeverity[t.severity] = (acc[type].bySeverity[t.severity] ?? 0) + 1;
    return acc;
  }, {});

  const total = byTypeThreats.length || 1;
  const result = Object.entries(typeMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([type, data]) => ({
      attackType: type,
      count: data.count,
      percentage: parseFloat(((data.count / total) * 100).toFixed(1)),
      severityBreakdown: data.bySeverity,
    }));

  res.json(result.map(r => GetThreatsByTypeResponseItem.parse(r)));
});

// /threats/timeline — from DB (seeded with hour spread)
router.get("/threats/timeline", async (_req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const timeline = await db
    .select({
      hour: sql<string>`to_char(date_trunc('hour', ${threatEventsTable.timestamp}), 'HH24:MI')`,
      count: count(),
      critical: sql<number>`count(*) filter (where ${threatEventsTable.severity} = 'critical')`,
      high: sql<number>`count(*) filter (where ${threatEventsTable.severity} = 'high')`,
    })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .groupBy(sql`date_trunc('hour', ${threatEventsTable.timestamp})`)
    .orderBy(sql`date_trunc('hour', ${threatEventsTable.timestamp})`);

  res.json(timeline.map(t => GetThreatTimelineResponseItem.parse({
    hour: t.hour,
    count: t.count,
    critical: Number(t.critical),
    high: Number(t.high),
  })));
});

// /news — REAL DATA from multiple RSS feeds
router.get("/news", async (req, res): Promise<void> => {
  const parsed = ListCyberNewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 30, category } = parsed.data;
  let articles = await fetchRealNews(60);

  if (category && category !== "All") {
    articles = articles.filter(a => a.category === category);
  }

  const result = articles.slice(0, limit).map(a => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    url: a.url,
    source: a.source,
    publishedAt: a.publishedAt,
    category: a.category,
    tags: a.tags,
    severity: (a.severity ?? "info") as "critical" | "high" | "medium" | "low" | "info",
    relatedCountries: a.relatedCountries,
    imageUrl: a.imageUrl,
  }));

  res.json(result.map(r => ListCyberNewsResponseItem.parse(r)));
});

// /news/trending — REAL CVEs from NVD + DB threat actors
router.get("/news/trending", async (_req, res): Promise<void> => {
  const [actors, cves] = await Promise.all([
    db.select().from(threatActorsTable).limit(5),
    fetchRecentCves(),
  ]);

  const result = {
    threatActors: actors.map(a => ({
      name: a.name,
      alias: JSON.parse(a.alias) as string[],
      originCountry: a.originCountry,
      motivation: a.motivation,
      recentActivity: a.recentActivity,
      targetSectors: JSON.parse(a.targetSectors) as string[],
      threatLevel: a.threatLevel as "critical" | "high" | "medium" | "low",
    })),
    recentCves: cves.map(c => ({
      cveId: c.cveId,
      cvssScore: c.cvssScore,
      severity: c.severity,
      description: c.description,
      affectedSoftware: c.affectedSoftware,
      publishedAt: c.publishedAt,
      exploitAvailable: c.exploitAvailable,
    })),
    activeCampaigns: [
      "Operation ShadowDragon — APT28 targeting NATO infrastructure",
      "PowMix Botnet — Czech workforce malware campaign",
      "QakBot C2 Resurgence — US/UK financial sector",
      "Grinex Hack — $13.7M cryptocurrency theft",
      "Mirai Nexcorium — IoT DDoS botnet expansion",
    ],
  };

  res.json(GetTrendingThreatsResponse.parse(result));
});

export default router;
