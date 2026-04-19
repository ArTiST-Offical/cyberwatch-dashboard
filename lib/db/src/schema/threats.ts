import { pgTable, text, integer, real, timestamp, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const threatEventsTable = pgTable("threat_events", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  attackerCountry: text("attacker_country").notNull(),
  attackerCountryCode: text("attacker_country_code").notNull(),
  attackerIp: text("attacker_ip"),
  attackerLat: real("attacker_lat").notNull(),
  attackerLng: real("attacker_lng").notNull(),
  targetCountry: text("target_country").notNull(),
  targetCountryCode: text("target_country_code").notNull(),
  targetIp: text("target_ip"),
  targetLat: real("target_lat").notNull(),
  targetLng: real("target_lng").notNull(),
  attackType: text("attack_type").notNull(),
  severity: text("severity").notNull(),
  port: integer("port"),
  protocol: text("protocol"),
  description: text("description"),
  technique: text("technique"),
  mitreTactic: text("mitre_tactic"),
});

export const newsArticlesTable = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  category: text("category").notNull(),
  tags: text("tags").notNull().default("[]"),
  severity: text("severity"),
  relatedCountries: text("related_countries").notNull().default("[]"),
});

export const threatActorsTable = pgTable("threat_actors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  alias: text("alias").notNull().default("[]"),
  originCountry: text("origin_country").notNull(),
  motivation: text("motivation").notNull(),
  recentActivity: text("recent_activity").notNull(),
  targetSectors: text("target_sectors").notNull().default("[]"),
  threatLevel: text("threat_level").notNull(),
});

export const cveEntriesTable = pgTable("cve_entries", {
  id: serial("id").primaryKey(),
  cveId: text("cve_id").notNull().unique(),
  cvssScore: real("cvss_score").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  affectedSoftware: text("affected_software").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  exploitAvailable: boolean("exploit_available").notNull().default(false),
});

export const insertThreatEventSchema = createInsertSchema(threatEventsTable).omit({ id: true });
export type InsertThreatEvent = z.infer<typeof insertThreatEventSchema>;
export type ThreatEvent = typeof threatEventsTable.$inferSelect;

export const insertNewsArticleSchema = createInsertSchema(newsArticlesTable).omit({ id: true });
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticlesTable.$inferSelect;

export const insertThreatActorSchema = createInsertSchema(threatActorsTable).omit({ id: true });
export type InsertThreatActor = z.infer<typeof insertThreatActorSchema>;
export type ThreatActor = typeof threatActorsTable.$inferSelect;

export const insertCveEntrySchema = createInsertSchema(cveEntriesTable).omit({ id: true });
export type InsertCveEntry = z.infer<typeof insertCveEntrySchema>;
export type CveEntry = typeof cveEntriesTable.$inferSelect;
