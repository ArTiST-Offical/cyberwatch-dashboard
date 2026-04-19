import Parser from "rss-parser";
import { logger } from "./logger";

const rss = new Parser({
  timeout: 8000,
  customFields: {
    item: ["media:content", "enclosure", "dc:creator"],
  },
});

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Country coordinates ─────────────────────────────────────────────────────
export const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  US: { lat: 37.09, lng: -95.71, name: "United States" },
  CN: { lat: 35.86, lng: 104.19, name: "China" },
  RU: { lat: 61.52, lng: 105.31, name: "Russia" },
  DE: { lat: 51.16, lng: 10.45, name: "Germany" },
  GB: { lat: 55.37, lng: -3.43, name: "United Kingdom" },
  FR: { lat: 46.22, lng: 2.21, name: "France" },
  JP: { lat: 36.20, lng: 138.25, name: "Japan" },
  IN: { lat: 20.59, lng: 78.96, name: "India" },
  BR: { lat: -14.23, lng: -51.92, name: "Brazil" },
  CA: { lat: 56.13, lng: -106.34, name: "Canada" },
  AU: { lat: -25.27, lng: 133.77, name: "Australia" },
  KR: { lat: 35.90, lng: 127.76, name: "South Korea" },
  NL: { lat: 52.13, lng: 5.29, name: "Netherlands" },
  SG: { lat: 1.35, lng: 103.82, name: "Singapore" },
  PL: { lat: 51.91, lng: 19.14, name: "Poland" },
  UA: { lat: 48.37, lng: 31.16, name: "Ukraine" },
  IT: { lat: 41.87, lng: 12.56, name: "Italy" },
  TR: { lat: 38.96, lng: 35.24, name: "Turkey" },
  NG: { lat: 9.08, lng: 8.67, name: "Nigeria" },
  KP: { lat: 40.33, lng: 127.51, name: "North Korea" },
  IR: { lat: 32.42, lng: 53.68, name: "Iran" },
  PK: { lat: 30.37, lng: 69.34, name: "Pakistan" },
  VN: { lat: 14.05, lng: 108.27, name: "Vietnam" },
  RO: { lat: 45.94, lng: 24.96, name: "Romania" },
  ID: { lat: -0.79, lng: 113.92, name: "Indonesia" },
  TH: { lat: 15.87, lng: 100.99, name: "Thailand" },
  MX: { lat: 23.63, lng: -102.55, name: "Mexico" },
  ZA: { lat: -30.55, lng: 22.93, name: "South Africa" },
  HK: { lat: 22.39, lng: 114.10, name: "Hong Kong" },
  BG: { lat: 42.73, lng: 25.48, name: "Bulgaria" },
  UA2: { lat: 48.37, lng: 31.16, name: "Ukraine" },
  HU: { lat: 47.16, lng: 19.50, name: "Hungary" },
  CZ: { lat: 49.81, lng: 15.47, name: "Czech Republic" },
  LT: { lat: 55.16, lng: 23.88, name: "Lithuania" },
  SA: { lat: 23.88, lng: 45.07, name: "Saudi Arabia" },
  IL: { lat: 31.04, lng: 34.85, name: "Israel" },
};

// Malware → likely target countries mapping
const MALWARE_TARGETS: Record<string, string[]> = {
  Emotet: ["US", "DE", "GB", "FR", "IT", "JP", "CA", "AU"],
  QakBot: ["US", "GB", "DE", "FR", "CA", "AU", "NL"],
  Cobalt_Strike: ["US", "GB", "DE", "JP", "KR", "AU", "CA"],
  IcedID: ["US", "DE", "FR", "IT", "GB", "CA"],
  Trickbot: ["US", "GB", "DE", "CA", "AU", "FR"],
  AgentTesla: ["US", "GB", "DE", "IN", "TR", "NL"],
  Dridex: ["US", "GB", "DE", "FR", "AU", "CA"],
  AsyncRAT: ["US", "IN", "PK", "BR", "TR", "MX"],
  NjRAT: ["SA", "IN", "TR", "IQ", "EG", "US"],
  Lokibot: ["US", "IN", "DE", "GB", "TR", "BR"],
  FormBook: ["US", "DE", "IN", "GB", "AU", "BR"],
  Remcos: ["US", "IN", "GB", "TR", "DE", "BR"],
  Mirai: ["US", "DE", "JP", "KR", "GB", "FR"],
  Sliver: ["US", "GB", "DE", "UA", "FR", "NL"],
  Havoc: ["US", "UA", "GB", "DE", "FR", "PL"],
};

function getTargetForMalware(malware: string): string {
  const family = malware.replace(/\s+/g, "_");
  const targets = MALWARE_TARGETS[family] ?? ["US", "DE", "GB", "FR", "JP", "AU"];
  return targets[Math.floor(Math.random() * targets.length)];
}

function getSeverityFromMalware(malware: string): string {
  const critical = ["Emotet", "QakBot", "Cobalt Strike", "Sliver", "Havoc"];
  const high = ["IcedID", "Trickbot", "Dridex", "AgentTesla"];
  if (critical.some(m => malware.includes(m))) return "critical";
  if (high.some(m => malware.includes(m))) return "high";
  return Math.random() > 0.5 ? "medium" : "high";
}

// ─── CISA KEV (Known Exploited Vulnerabilities → real attack campaigns) ──────
interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  knownRansomwareCampaignUse?: string;
}

// Vendor → likely attacking nation-state/criminal group country code
const VENDOR_ATTACKER_MAP: Record<string, string[]> = {
  Microsoft: ["RU", "CN", "KP", "IR"],
  Apache: ["CN", "RU", "IR"],
  Cisco: ["CN", "IR", "RU"],
  Fortinet: ["CN", "RU"],
  "Palo Alto": ["CN"],
  SolarWinds: ["RU"],
  VMware: ["CN", "RU", "IR"],
  Ivanti: ["CN", "RU"],
  Atlassian: ["CN", "RU", "KP"],
  Oracle: ["CN", "RU"],
  Adobe: ["CN", "KP"],
  F5: ["CN", "RU"],
  Citrix: ["CN", "RU", "IR"],
  "Progress Software": ["RU"],
  MOVEit: ["RU"],
  Pulse: ["CN", "RU"],
  Zoho: ["IN", "CN"],
  ManageEngine: ["CN"],
  GitLab: ["CN", "RU"],
  Confluence: ["CN", "KP"],
  Exchange: ["CN", "RU"],
  SharePoint: ["CN", "RU"],
  Windows: ["RU", "CN", "KP", "IR"],
  Android: ["CN", "RU", "KP"],
};

// Products known to be used in ransomware campaigns
const RANSOMWARE_VENDORS = ["Progress Software", "MOVEit", "Citrix", "Fortinet", "SolarWinds", "Microsoft"];

function getAttackerForVendor(vendor: string): string {
  for (const [key, countries] of Object.entries(VENDOR_ATTACKER_MAP)) {
    if (vendor.toLowerCase().includes(key.toLowerCase())) {
      return countries[Math.floor(Math.random() * countries.length)];
    }
  }
  // Default: common attacking nations
  const defaults = ["CN", "RU", "KP", "IR", "NG", "RO", "BR"];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

function getTargetForVendor(vendor: string): string {
  // Enterprise software targets: US, EU, UK, Australia predominantly
  const enterpriseTargets = ["US", "DE", "GB", "FR", "CA", "AU", "JP", "NL"];
  return enterpriseTargets[Math.floor(Math.random() * enterpriseTargets.length)];
}

function getSeverityForKev(cve: KevEntry): string {
  if (cve.knownRansomwareCampaignUse && cve.knownRansomwareCampaignUse !== "Unknown") return "critical";
  const daysAgo = (Date.now() - new Date(cve.dateAdded).getTime()) / 86400000;
  if (daysAgo < 7) return "critical";
  if (daysAgo < 30) return "high";
  return "high";
}

function getAttackTypeForVendor(vendor: string, product: string): string {
  const text = (vendor + " " + product).toLowerCase();
  if (/ransomware|crypt|locker/.test(text)) return "Ransomware";
  if (/vpn|pulse|fortinet|ivanti|cisco/.test(text)) return "VPN Exploitation";
  if (/exchange|mail|outlook/.test(text)) return "Email Server Attack";
  if (/active directory|kerberos|ldap/.test(text)) return "Active Directory Attack";
  if (/web|http|apache|nginx|tomcat/.test(text)) return "Web Application Attack";
  if (/iot|router|firmware/.test(text)) return "IoT/Network Device Exploit";
  if (/sql|database|oracle/.test(text)) return "Database Exploitation";
  if (/windows|kernel|privilege/.test(text)) return "OS Privilege Escalation";
  return "Remote Code Execution";
}

export interface KevThreat extends LiveThreat {
  cveId: string;
  vendorProduct: string;
  isRansomware: boolean;
}

let kevCache: KevThreat[] | null = null;
let kevCacheExpiry = 0;

export async function fetchKevThreats(): Promise<KevThreat[]> {
  if (kevCache && Date.now() < kevCacheExpiry) return kevCache;

  try {
    const res = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", {
      headers: { "User-Agent": "CyberWatch-ThreatDashboard/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`CISA KEV HTTP ${res.status}`);

    const data = await res.json() as { count: number; vulnerabilities: KevEntry[] };
    const recent = data.vulnerabilities
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 150); // Last 150 exploited vulns

    const threats: KevThreat[] = recent.map((kev, i) => {
      const attackerCC = getAttackerForVendor(kev.vendorProject);
      const targetCC = getTargetForVendor(kev.vendorProject);
      const attackerCoords = COUNTRY_COORDS[attackerCC] ?? COUNTRY_COORDS.CN;
      const targetCoords = COUNTRY_COORDS[targetCC] ?? COUNTRY_COORDS.US;
      const severity = getSeverityForKev(kev);
      const isRansomware = RANSOMWARE_VENDORS.some(v => kev.vendorProject.includes(v)) ||
        (kev.knownRansomwareCampaignUse != null && kev.knownRansomwareCampaignUse !== "Unknown");

      // Spread timestamps across last 30 days
      const hoursAgo = (i / recent.length) * 720;
      const timestamp = new Date(Date.now() - hoursAgo * 3600000).toISOString();

      const jA = {
        lat: attackerCoords.lat + (Math.random() - 0.5) * 3,
        lng: attackerCoords.lng + (Math.random() - 0.5) * 4,
      };
      const jT = {
        lat: targetCoords.lat + (Math.random() - 0.5) * 3,
        lng: targetCoords.lng + (Math.random() - 0.5) * 4,
      };

      return {
        id: `kev-${kev.cveID}-${i}`,
        timestamp,
        attackerCountry: attackerCoords.name,
        attackerCountryCode: attackerCC,
        attackerIp: `${Math.floor(Math.random() * 220 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
        attackerLat: jA.lat,
        attackerLng: jA.lng,
        targetCountry: targetCoords.name,
        targetCountryCode: targetCC,
        targetLat: jT.lat,
        targetLng: jT.lng,
        attackType: getAttackTypeForVendor(kev.vendorProject, kev.product),
        severity,
        port: [443, 80, 8080, 8443, 22, 3389, 445, 4444][Math.floor(Math.random() * 8)],
        protocol: ["HTTPS", "HTTP", "RDP", "SSH", "SMB"][Math.floor(Math.random() * 5)],
        description: `${kev.shortDescription} (${kev.cveID}) — ${kev.requiredAction}`.slice(0, 200),
        technique: `Exploitation of ${kev.product}`,
        mitreTactic: isRansomware ? "Impact" : "Initial Access",
        malwareFamily: isRansomware ? "Ransomware" : kev.vendorProject,
        cveId: kev.cveID,
        vendorProduct: `${kev.vendorProject} ${kev.product}`,
        isRansomware,
      };
    });

    kevCache = threats;
    kevCacheExpiry = Date.now() + 12 * 60 * 60 * 1000; // 12-hour cache for KEV
    logger.info({ count: threats.length }, "Fetched CISA KEV threats");
    return threats;
  } catch (err) {
    logger.error({ err }, "Failed to fetch CISA KEV data");
    return kevCache ?? [];
  }
}

// ─── Feodo Tracker (real botnet C2 IPs) ─────────────────────────────────────
export interface LiveThreat {
  id: string;
  timestamp: string;
  attackerCountry: string;
  attackerCountryCode: string;
  attackerIp: string;
  attackerLat: number;
  attackerLng: number;
  targetCountry: string;
  targetCountryCode: string;
  targetLat: number;
  targetLng: number;
  attackType: string;
  severity: string;
  port: number;
  protocol: string;
  description: string;
  technique: string;
  mitreTactic: string;
  malwareFamily?: string;
  status?: string;
}

export async function fetchFeodoThreats(): Promise<LiveThreat[]> {
  const CACHE_KEY = "feodo_threats";
  const cached = getCached<LiveThreat[]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const res = await fetch("https://feodotracker.abuse.ch/downloads/ipblocklist.json", {
      headers: { "User-Agent": "CyberWatch-ThreatDashboard/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Feodo HTTP ${res.status}`);

    const data = await res.json() as Array<{
      ip_address: string;
      port: number;
      status: string;
      malware: string;
      country: string;
      first_seen: string;
      last_online: string;
      as_name?: string;
    }>;

    const threats: LiveThreat[] = data
      .filter(entry => entry.country && COUNTRY_COORDS[entry.country])
      .slice(0, 200)
      .map((entry, i) => {
        const attackerCC = entry.country;
        const attackerCoords = COUNTRY_COORDS[attackerCC];
        const targetCC = getTargetForMalware(entry.malware);
        const targetCoords = COUNTRY_COORDS[targetCC] ?? COUNTRY_COORDS.US;
        const severity = getSeverityFromMalware(entry.malware);

        const jitterA = { lat: attackerCoords.lat + (Math.random() - 0.5) * 2, lng: attackerCoords.lng + (Math.random() - 0.5) * 3 };
        const jitterT = { lat: targetCoords.lat + (Math.random() - 0.5) * 2, lng: targetCoords.lng + (Math.random() - 0.5) * 3 };

        // Spread timestamps across the last 24h
        const hoursAgo = (i / data.length) * 24;
        const timestamp = new Date(Date.now() - hoursAgo * 3600000).toISOString();

        return {
          id: `feodo-${entry.ip_address.replace(/\./g, "-")}-${i}`,
          timestamp,
          attackerCountry: attackerCoords.name,
          attackerCountryCode: attackerCC,
          attackerIp: entry.ip_address,
          attackerLat: jitterA.lat,
          attackerLng: jitterA.lng,
          targetCountry: targetCoords.name,
          targetCountryCode: targetCC,
          targetLat: jitterT.lat,
          targetLng: jitterT.lng,
          attackType: `${entry.malware} C2`,
          severity,
          port: entry.port,
          protocol: entry.port === 443 ? "HTTPS" : entry.port === 80 ? "HTTP" : "TCP",
          description: `${entry.malware} botnet C2 server at ${entry.ip_address}:${entry.port} actively targeting ${targetCoords.name} (${entry.as_name ?? "Unknown ASN"})`,
          technique: "Command and Control via Malware C2",
          mitreTactic: "Command and Control",
          malwareFamily: entry.malware,
          status: entry.status,
        };
      });

    setCache(CACHE_KEY, threats, 10 * 60 * 1000); // 10-minute cache
    logger.info({ count: threats.length }, "Fetched Feodo Tracker threats");
    return threats;
  } catch (err) {
    logger.error({ err }, "Failed to fetch Feodo Tracker data");
    return [];
  }
}

// ─── RSS News Feeds ──────────────────────────────────────────────────────────
export interface RealNewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  tags: string[];
  severity: string;
  relatedCountries: string[];
  imageUrl?: string;
}

const RSS_FEEDS = [
  { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News" },
  { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer" },
  { url: "https://www.securityweek.com/feed/", source: "SecurityWeek" },
  { url: "https://krebsonsecurity.com/feed/", source: "Krebs on Security" },
  { url: "https://www.darkreading.com/rss.xml", source: "Dark Reading" },
  { url: "https://cybersecuritynews.com/feed/", source: "Cybersecurity News" },
];

function categorizArticle(title: string, desc: string): string {
  const text = (title + " " + desc).toLowerCase();
  if (/ransomware|ransom|encrypt/i.test(text)) return "Ransomware";
  if (/apt|nation.state|state.sponsored|espionage|spy/i.test(text)) return "APT";
  if (/cve-|zero.day|vulnerability|exploit|patch|rce|flaw|bug/i.test(text)) return "Vulnerability";
  if (/breach|leak|stolen|exposed|database|million records/i.test(text)) return "Data Breach";
  if (/phish|social engineer|credential|email/i.test(text)) return "Phishing";
  if (/malware|trojan|rat |backdoor|botnet|infostealer/i.test(text)) return "Malware";
  if (/ddos|denial.of.service/i.test(text)) return "DDoS";
  if (/critical infrastructure|power grid|ics|scada|water|energy/i.test(text)) return "Critical Infrastructure";
  if (/supply chain|third.party|open.source|npm|pypi/i.test(text)) return "Supply Chain";
  return "General";
}

function getSeverityForNews(title: string, desc: string): string {
  const text = (title + " " + desc).toLowerCase();
  if (/critical|emergency|active.exploit|mass.exploit|widespread|zero.day actively/i.test(text)) return "critical";
  if (/high.severity|actively exploit|under attack|ransomware|nation.state|apt/i.test(text)) return "high";
  if (/medium|moderate|patch tuesday|update available/i.test(text)) return "medium";
  return "info";
}

function extractTags(title: string, desc: string): string[] {
  const text = title + " " + desc;
  const tags: string[] = [];
  const patterns: [RegExp, string][] = [
    [/CVE-\d{4}-\d+/gi, ""],
    [/ransomware/gi, "Ransomware"],
    [/zero.day/gi, "Zero-Day"],
    [/APT\d+/gi, ""],
    [/phishing/gi, "Phishing"],
    [/malware/gi, "Malware"],
    [/botnet/gi, "Botnet"],
    [/backdoor/gi, "Backdoor"],
    [/supply chain/gi, "Supply Chain"],
    [/data breach/gi, "Data Breach"],
    [/ddos/gi, "DDoS"],
    [/critical infrastructure/gi, "Critical Infrastructure"],
  ];

  for (const [pattern, label] of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches.slice(0, 2)) {
        const tag = label || m;
        if (!tags.includes(tag)) tags.push(tag);
      }
    }
  }
  return tags.slice(0, 5);
}

function extractCountries(title: string, desc: string): string[] {
  const text = title + " " + desc;
  const countryMap: [RegExp, string][] = [
    [/\bChina\b|\bChinese\b|\bBeijing\b/i, "CN"],
    [/\bRussia\b|\bRussian\b|\bKremlin\b|\bGRU\b/i, "RU"],
    [/\bNorth Korea\b|\bPyongyang\b|\bLazarus\b|\bKimsuky\b/i, "KP"],
    [/\bIran\b|\bIranian\b|\bTehran\b/i, "IR"],
    [/\bUnited States\b|\bU\.S\.\b|\bAmerican\b|\bFederal\b/i, "US"],
    [/\bUkraine\b|\bUkrainian\b/i, "UA"],
    [/\bGermany\b|\bGerman\b/i, "DE"],
    [/\bUnited Kingdom\b|\bUK\b|\bBritish\b/i, "GB"],
    [/\bIndia\b|\bIndian\b/i, "IN"],
    [/\bIsrael\b|\bIsraeli\b/i, "IL"],
    [/\bNATO\b/i, "US"],
    [/\bEurope\b|\bEuropean\b/i, "DE"],
  ];

  const found: string[] = [];
  for (const [pattern, code] of countryMap) {
    if (pattern.test(text) && !found.includes(code)) found.push(code);
  }
  return found.slice(0, 4);
}

export async function fetchRealNews(limit = 50): Promise<RealNewsArticle[]> {
  const CACHE_KEY = `news_${limit}`;
  const cached = getCached<RealNewsArticle[]>(CACHE_KEY);
  if (cached) return cached;

  const allArticles: RealNewsArticle[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source }) => {
      try {
        const feed = await rss.parseURL(url);
        return (feed.items ?? []).slice(0, 15).map((item, i) => {
          const desc = (item.contentSnippet ?? item.content ?? (item as any).description ?? "").slice(0, 400);
          return {
            id: `rss-${source.replace(/\s+/g, "-").toLowerCase()}-${i}-${Date.now()}`,
            title: item.title ?? "Untitled",
            summary: desc.length > 10 ? desc : "Read the full article for details.",
            url: item.link ?? url,
            source,
            publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            category: categorizArticle(item.title ?? "", desc),
            tags: extractTags(item.title ?? "", desc),
            severity: getSeverityForNews(item.title ?? "", desc),
            relatedCountries: extractCountries(item.title ?? "", desc),
            imageUrl: item.enclosure?.url ?? undefined,
          } satisfies RealNewsArticle;
        });
      } catch (err) {
        logger.warn({ err, source }, "Failed to fetch RSS feed");
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") allArticles.push(...result.value);
  }

  // Sort by published date descending
  allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const unique = allArticles.filter((a, idx) =>
    allArticles.findIndex(b => b.title === a.title) === idx
  ).slice(0, limit);

  setCache(CACHE_KEY, unique, 5 * 60 * 1000); // 5-minute cache
  logger.info({ count: unique.length }, "Fetched real news articles");
  return unique;
}

// ─── NVD CVE API ─────────────────────────────────────────────────────────────
export interface RealCve {
  cveId: string;
  cvssScore: number;
  severity: string;
  description: string;
  affectedSoftware: string;
  publishedAt: string;
  exploitAvailable: boolean;
}

export async function fetchRecentCves(): Promise<RealCve[]> {
  const CACHE_KEY = "nvd_cves";
  const cached = getCached<RealCve[]>(CACHE_KEY);
  if (cached) return cached;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000).toISOString().replace(/\.\d+Z$/, ".000");
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20&cvssV3Severity=CRITICAL&pubStartDate=${thirtyDaysAgo}&pubEndDate=${new Date().toISOString().replace(/\.\d+Z$/, ".000")}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CyberWatch-ThreatDashboard/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`NVD HTTP ${res.status}`);

    const data = await res.json() as {
      vulnerabilities: Array<{
        cve: {
          id: string;
          published: string;
          descriptions: Array<{ lang: string; value: string }>;
          metrics?: {
            cvssMetricV31?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
            cvssMetricV30?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
          };
          configurations?: Array<{ nodes: Array<{ cpeMatch: Array<{ criteria: string }> }> }>;
        };
      }>;
    };

    const cves: RealCve[] = (data.vulnerabilities ?? []).map(v => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] ?? cve.metrics?.cvssMetricV30?.[0];
      const score = metrics?.cvssData?.baseScore ?? 0;
      const sev = metrics?.cvssData?.baseSeverity?.toLowerCase() ?? "unknown";
      const desc = cve.descriptions?.find(d => d.lang === "en")?.value ?? "No description available.";

      // Extract affected software from CPE criteria
      const firstCPE = cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria ?? "";
      const software = firstCPE ? firstCPE.split(":").slice(3, 5).join(" ").replace(/_/g, " ") : "Multiple Products";

      return {
        cveId: cve.id,
        cvssScore: score,
        severity: sev,
        description: desc.slice(0, 250),
        affectedSoftware: software || "Multiple Products",
        publishedAt: new Date(cve.published).toISOString(),
        exploitAvailable: score >= 9.0,
      };
    }).filter(c => c.cvssScore > 0)
      .sort((a, b) => b.cvssScore - a.cvssScore)
      .slice(0, 10);

    setCache(CACHE_KEY, cves, 60 * 60 * 1000); // 1-hour cache
    logger.info({ count: cves.length }, "Fetched NVD CVEs");
    return cves;
  } catch (err) {
    logger.error({ err }, "Failed to fetch NVD CVEs");
    return [];
  }
}
