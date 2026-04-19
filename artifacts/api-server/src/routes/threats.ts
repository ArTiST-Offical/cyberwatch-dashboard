import { Router, type IRouter } from "express";
import { db, threatEventsTable, newsArticlesTable, threatActorsTable, cveEntriesTable } from "@workspace/db";
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

router.get("/threats", async (req, res): Promise<void> => {
  const parsed = ListThreatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, attackType, severity } = parsed.data;

  const conditions = [];
  if (attackType) {
    conditions.push(eq(threatEventsTable.attackType, attackType));
  }
  if (severity) {
    conditions.push(eq(threatEventsTable.severity, severity));
  }

  const threats = await db
    .select()
    .from(threatEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(threatEventsTable.timestamp))
    .limit(limit);

  res.json(threats.map(formatThreatEvent).map(e => ListThreatsResponseItem.parse(e)));
});

router.get("/threats/live", async (_req, res): Promise<void> => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const threats = await db
    .select()
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, fiveMinutesAgo))
    .orderBy(desc(threatEventsTable.timestamp))
    .limit(30);

  res.json(threats.map(formatThreatEvent).map(e => GetLiveThreatsResponseItem.parse(e)));
});

router.get("/threats/stats", async (_req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalResult] = await db
    .select({ count: count() })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo));

  const severityCounts = await db
    .select({
      severity: threatEventsTable.severity,
      count: count(),
    })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .groupBy(threatEventsTable.severity);

  const uniqueAttackers = await db
    .selectDistinct({ code: threatEventsTable.attackerCountryCode })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo));

  const uniqueTargets = await db
    .selectDistinct({ code: threatEventsTable.targetCountryCode })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo));

  const [topTypeResult] = await db
    .select({
      attackType: threatEventsTable.attackType,
      count: count(),
    })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .groupBy(threatEventsTable.attackType)
    .orderBy(desc(count()))
    .limit(1);

  const allCountries = await db
    .selectDistinct({ code: threatEventsTable.attackerCountryCode })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .union(
      db
        .selectDistinct({ code: threatEventsTable.targetCountryCode })
        .from(threatEventsTable)
        .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    );

  const total = totalResult?.count ?? 0;
  const critical = severityCounts.find(s => s.severity === "critical")?.count ?? 0;
  const high = severityCounts.find(s => s.severity === "high")?.count ?? 0;
  const medium = severityCounts.find(s => s.severity === "medium")?.count ?? 0;
  const low = severityCounts.find(s => s.severity === "low")?.count ?? 0;
  const attacksPerMinute = parseFloat((total / (24 * 60)).toFixed(2));

  const stats = {
    totalAttacks24h: total,
    criticalAttacks: critical,
    highAttacks: high,
    mediumAttacks: medium,
    lowAttacks: low,
    attacksPerMinute,
    uniqueAttackers: uniqueAttackers.length,
    uniqueTargets: uniqueTargets.length,
    mostCommonAttackType: topTypeResult?.attackType ?? "Unknown",
    totalCountriesAffected: allCountries.length,
  };

  res.json(GetThreatStatsResponse.parse(stats));
});

router.get("/threats/top-attackers", async (_req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const attackers = await db
    .select({
      country: threatEventsTable.attackerCountry,
      countryCode: threatEventsTable.attackerCountryCode,
      count: count(),
    })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .groupBy(threatEventsTable.attackerCountry, threatEventsTable.attackerCountryCode)
    .orderBy(desc(count()))
    .limit(10);

  const [totalResult] = await db
    .select({ count: count() })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo));
  const total = totalResult?.count ?? 1;

  const result = attackers.map(a => ({
    country: a.country,
    countryCode: a.countryCode,
    attackCount: a.count,
    percentage: parseFloat(((a.count / total) * 100).toFixed(1)),
    topAttackTypes: ["DDoS", "SQL Injection", "Phishing"],
  }));

  res.json(result.map(r => GetTopAttackersResponseItem.parse(r)));
});

router.get("/threats/top-targets", async (_req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const targets = await db
    .select({
      country: threatEventsTable.targetCountry,
      countryCode: threatEventsTable.targetCountryCode,
      count: count(),
    })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .groupBy(threatEventsTable.targetCountry, threatEventsTable.targetCountryCode)
    .orderBy(desc(count()))
    .limit(10);

  const [totalResult] = await db
    .select({ count: count() })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo));
  const total = totalResult?.count ?? 1;

  const result = targets.map(t => ({
    country: t.country,
    countryCode: t.countryCode,
    attackCount: t.count,
    percentage: parseFloat(((t.count / total) * 100).toFixed(1)),
    topAttackTypes: ["DDoS", "Malware", "Phishing"],
  }));

  res.json(result.map(r => GetTopTargetsResponseItem.parse(r)));
});

router.get("/threats/by-type", async (_req, res): Promise<void> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const types = await db
    .select({
      attackType: threatEventsTable.attackType,
      count: count(),
    })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo))
    .groupBy(threatEventsTable.attackType)
    .orderBy(desc(count()));

  const [totalResult] = await db
    .select({ count: count() })
    .from(threatEventsTable)
    .where(gte(threatEventsTable.timestamp, twentyFourHoursAgo));
  const total = totalResult?.count ?? 1;

  const result = types.map(t => ({
    attackType: t.attackType,
    count: t.count,
    percentage: parseFloat(((t.count / total) * 100).toFixed(1)),
    severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
  }));

  res.json(result.map(r => GetThreatsByTypeResponseItem.parse(r)));
});

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

router.get("/news", async (req, res): Promise<void> => {
  const parsed = ListCyberNewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 20, category } = parsed.data;
  const conditions = [];
  if (category) {
    conditions.push(eq(newsArticlesTable.category, category));
  }

  const articles = await db
    .select()
    .from(newsArticlesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(newsArticlesTable.publishedAt))
    .limit(limit);

  const result = articles.map(a => ({
    id: a.externalId,
    title: a.title,
    summary: a.summary,
    url: a.url,
    source: a.source,
    publishedAt: a.publishedAt.toISOString(),
    category: a.category,
    tags: JSON.parse(a.tags) as string[],
    severity: a.severity as "critical" | "high" | "medium" | "low" | "info" | undefined,
    relatedCountries: JSON.parse(a.relatedCountries) as string[],
  }));

  res.json(result.map(r => ListCyberNewsResponseItem.parse(r)));
});

router.get("/news/trending", async (_req, res): Promise<void> => {
  const actors = await db.select().from(threatActorsTable).limit(5);
  const cves = await db.select().from(cveEntriesTable).orderBy(desc(cveEntriesTable.cvssScore)).limit(5);

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
      publishedAt: c.publishedAt.toISOString(),
      exploitAvailable: c.exploitAvailable,
    })),
    activeCampaigns: [
      "Operation ShadowDragon", "PhantomNet Campaign", "BlueVault Intrusion Series",
      "Lazarus APT Surge", "DarkSide Ransomware Wave",
    ],
  };

  res.json(GetTrendingThreatsResponse.parse(result));
});

export default router;
