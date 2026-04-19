import { db, threatEventsTable, newsArticlesTable, threatActorsTable, cveEntriesTable } from "@workspace/db";

const COUNTRIES = [
  { name: "China", code: "CN", lat: 35.86, lng: 104.19 },
  { name: "Russia", code: "RU", lat: 61.52, lng: 105.31 },
  { name: "United States", code: "US", lat: 37.09, lng: -95.71 },
  { name: "North Korea", code: "KP", lat: 40.33, lng: 127.51 },
  { name: "Iran", code: "IR", lat: 32.42, lng: 53.68 },
  { name: "Brazil", code: "BR", lat: -14.23, lng: -51.92 },
  { name: "India", code: "IN", lat: 20.59, lng: 78.96 },
  { name: "Germany", code: "DE", lat: 51.16, lng: 10.45 },
  { name: "United Kingdom", code: "GB", lat: 55.37, lng: -3.43 },
  { name: "Ukraine", code: "UA", lat: 48.37, lng: 31.16 },
  { name: "Romania", code: "RO", lat: 45.94, lng: 24.96 },
  { name: "Netherlands", code: "NL", lat: 52.13, lng: 5.29 },
  { name: "France", code: "FR", lat: 46.22, lng: 2.21 },
  { name: "Pakistan", code: "PK", lat: 30.37, lng: 69.34 },
  { name: "Vietnam", code: "VN", lat: 14.05, lng: 108.27 },
  { name: "Nigeria", code: "NG", lat: 9.08, lng: 8.67 },
  { name: "Turkey", code: "TR", lat: 38.96, lng: 35.24 },
  { name: "Japan", code: "JP", lat: 36.20, lng: 138.25 },
  { name: "South Korea", code: "KR", lat: 35.90, lng: 127.76 },
  { name: "Australia", code: "AU", lat: -25.27, lng: 133.77 },
  { name: "Canada", code: "CA", lat: 56.13, lng: -106.34 },
  { name: "Israel", code: "IL", lat: 31.04, lng: 34.85 },
  { name: "Saudi Arabia", code: "SA", lat: 23.88, lng: 45.07 },
  { name: "Mexico", code: "MX", lat: 23.63, lng: -102.55 },
  { name: "Poland", code: "PL", lat: 51.91, lng: 19.14 },
];

const ATTACK_TYPES = [
  { type: "DDoS", technique: "Volumetric Flood", tactic: "Impact" },
  { type: "SQL Injection", technique: "SQLi - Union Based", tactic: "Initial Access" },
  { type: "Phishing", technique: "Spear Phishing Attachment", tactic: "Initial Access" },
  { type: "Ransomware", technique: "Data Encrypted for Impact", tactic: "Impact" },
  { type: "Brute Force", technique: "Password Spraying", tactic: "Credential Access" },
  { type: "Zero-Day Exploit", technique: "Exploit Public-Facing Application", tactic: "Initial Access" },
  { type: "Man-in-the-Middle", technique: "Adversary-in-the-Middle", tactic: "Collection" },
  { type: "Supply Chain", technique: "Compromise Software Supply Chain", tactic: "Initial Access" },
  { type: "APT Intrusion", technique: "Spearphishing Link", tactic: "Initial Access" },
  { type: "Cryptojacking", technique: "Resource Hijacking", tactic: "Impact" },
  { type: "DNS Hijacking", technique: "DNS Server Hijacking", tactic: "Defense Evasion" },
  { type: "Port Scan", technique: "Network Service Discovery", tactic: "Discovery" },
  { type: "Malware Injection", technique: "Dynamic-link Library Injection", tactic: "Defense Evasion" },
  { type: "Credential Theft", technique: "OS Credential Dumping", tactic: "Credential Access" },
  { type: "Social Engineering", technique: "Phishing for Information", tactic: "Reconnaissance" },
];

const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "SMTP", "FTP", "SSH", "RDP", "DNS"];
const COMMON_PORTS = [80, 443, 22, 3389, 21, 25, 53, 8080, 8443, 3306, 5432, 27017, 6379];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSeverity(): typeof SEVERITIES[number] {
  const rand = Math.random();
  if (rand < 0.15) return "critical";
  if (rand < 0.40) return "high";
  if (rand < 0.70) return "medium";
  return "low";
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function addJitter(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: lat + (Math.random() - 0.5) * 5,
    lng: lng + (Math.random() - 0.5) * 10,
  };
}

async function seedThreats() {
  console.log("Seeding threat events...");
  const events = [];

  const now = new Date();
  for (let i = 0; i < 500; i++) {
    const attacker = randomItem(COUNTRIES);
    let target = randomItem(COUNTRIES);
    while (target.code === attacker.code) {
      target = randomItem(COUNTRIES);
    }
    const attack = randomItem(ATTACK_TYPES);
    const severity = randomSeverity();
    const hoursAgo = Math.random() * 24;
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    const attackerJitter = addJitter(attacker.lat, attacker.lng);
    const targetJitter = addJitter(target.lat, target.lng);

    events.push({
      externalId: `evt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      attackerCountry: attacker.name,
      attackerCountryCode: attacker.code,
      attackerIp: randomIp(),
      attackerLat: attackerJitter.lat,
      attackerLng: attackerJitter.lng,
      targetCountry: target.name,
      targetCountryCode: target.code,
      targetIp: randomIp(),
      targetLat: targetJitter.lat,
      targetLng: targetJitter.lng,
      attackType: attack.type,
      severity,
      port: randomItem(COMMON_PORTS),
      protocol: randomItem(PROTOCOLS),
      description: `${attack.type} attack detected from ${attacker.name} targeting ${target.name} infrastructure`,
      technique: attack.technique,
      mitreTactic: attack.tactic,
    });
  }

  for (let i = 0; i < events.length; i += 50) {
    await db.insert(threatEventsTable).values(events.slice(i, i + 50)).onConflictDoNothing();
  }
  console.log(`Seeded ${events.length} threat events.`);
}

async function seedNews() {
  console.log("Seeding news articles...");
  const articles = [
    {
      externalId: "news-001",
      title: "LockBit 3.0 Ransomware Gang Resurfaces with New Variant Targeting Healthcare",
      summary: "The LockBit ransomware group, previously disrupted by Operation Cronos, has re-emerged with an enhanced variant specifically crafted to target hospital networks and medical device vendors across Europe and North America.",
      url: "https://example.com/news/lockbit-resurfaces",
      source: "ThreatPost",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      category: "Ransomware",
      tags: JSON.stringify(["LockBit", "Ransomware", "Healthcare", "APT"]),
      severity: "critical",
      relatedCountries: JSON.stringify(["RU", "US", "GB", "DE"]),
    },
    {
      externalId: "news-002",
      title: "Critical Zero-Day in Cisco IOS XE Actively Exploited in the Wild",
      summary: "Security researchers have confirmed active exploitation of CVE-2024-20399 in Cisco IOS XE, allowing unauthenticated remote code execution. Over 50,000 network devices remain unpatched and exposed.",
      url: "https://example.com/news/cisco-ios-xe-zero-day",
      source: "Bleeping Computer",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      category: "Vulnerability",
      tags: JSON.stringify(["Cisco", "Zero-Day", "CVE", "Network Security"]),
      severity: "critical",
      relatedCountries: JSON.stringify(["US", "CN", "KP"]),
    },
    {
      externalId: "news-003",
      title: "Lazarus Group Deploys New 'SilverBlaze' RAT in Cryptocurrency Exchange Heists",
      summary: "North Korea-linked Lazarus Group has been linked to a new remote access trojan targeting South Korean and Japanese cryptocurrency exchanges, with estimated losses exceeding $340 million.",
      url: "https://example.com/news/lazarus-silverblaze",
      source: "CrowdStrike Intelligence",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      category: "APT",
      tags: JSON.stringify(["Lazarus", "North Korea", "RAT", "Cryptocurrency"]),
      severity: "high",
      relatedCountries: JSON.stringify(["KP", "KR", "JP", "US"]),
    },
    {
      externalId: "news-004",
      title: "Massive Data Breach Exposes 2.7 Billion Records from Public Background Check Site",
      summary: "A massive data breach at a background check aggregation platform has exposed full names, social security numbers, addresses, and relative information for nearly 2.7 billion individuals.",
      url: "https://example.com/news/background-check-breach",
      source: "Dark Reading",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      category: "Data Breach",
      tags: JSON.stringify(["Data Breach", "PII", "Identity Theft"]),
      severity: "high",
      relatedCountries: JSON.stringify(["US"]),
    },
    {
      externalId: "news-005",
      title: "Iran-Linked APT42 Targets Presidential Campaign Staff via WhatsApp",
      summary: "Google's Threat Analysis Group reports that Iran-linked APT42 conducted targeted phishing attacks against campaign staffers of both major US presidential campaigns via WhatsApp and Gmail.",
      url: "https://example.com/news/apt42-campaign-targeting",
      source: "Google TAG",
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      category: "APT",
      tags: JSON.stringify(["APT42", "Iran", "Phishing", "Election"]),
      severity: "high",
      relatedCountries: JSON.stringify(["IR", "US"]),
    },
    {
      externalId: "news-006",
      title: "Russian Sandworm Group Disrupts Ukrainian Power Grid for Third Time",
      summary: "Sandworm APT, attributed to Russia's GRU, has successfully disrupted power distribution in western Ukraine using a novel variant of the Industroyer malware, affecting approximately 200,000 customers.",
      url: "https://example.com/news/sandworm-ukraine-power",
      source: "Wired Security",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      category: "Critical Infrastructure",
      tags: JSON.stringify(["Sandworm", "Russia", "ICS", "Ukraine", "Industroyer"]),
      severity: "critical",
      relatedCountries: JSON.stringify(["RU", "UA"]),
    },
    {
      externalId: "news-007",
      title: "Salt Typhoon Hackers Accessed US Telecom Networks for 18 Months",
      summary: "Chinese state-sponsored hackers known as Salt Typhoon maintained persistent access to at least three major US telecommunications providers for over 18 months, intercepting communications metadata.",
      url: "https://example.com/news/salt-typhoon-telecoms",
      source: "WSJ Security",
      publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
      category: "APT",
      tags: JSON.stringify(["Salt Typhoon", "China", "Telecommunications", "Espionage"]),
      severity: "critical",
      relatedCountries: JSON.stringify(["CN", "US"]),
    },
    {
      externalId: "news-008",
      title: "New Phishing Kit 'Sneaky2FA' Bypasses Two-Factor Authentication at Scale",
      summary: "A sophisticated adversary-in-the-middle phishing kit called Sneaky2FA has been observed targeting Microsoft 365 users, successfully bypassing SMS and authenticator app 2FA through real-time session token theft.",
      url: "https://example.com/news/sneaky2fa-phishing",
      source: "Sekoia Threat Intelligence",
      publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
      category: "Phishing",
      tags: JSON.stringify(["Phishing", "2FA Bypass", "Microsoft 365", "AiTM"]),
      severity: "high",
      relatedCountries: JSON.stringify(["RO", "NG", "US", "GB"]),
    },
    {
      externalId: "news-009",
      title: "CISA Emergency Directive: Patch Ivanti Connect Secure Immediately",
      summary: "CISA has issued an emergency directive requiring all federal agencies to patch two critical vulnerabilities in Ivanti Connect Secure VPN appliances within 48 hours, citing active exploitation.",
      url: "https://example.com/news/cisa-ivanti-directive",
      source: "CISA",
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      category: "Vulnerability",
      tags: JSON.stringify(["CISA", "Ivanti", "VPN", "Federal", "Patch"]),
      severity: "critical",
      relatedCountries: JSON.stringify(["CN", "US"]),
    },
    {
      externalId: "news-010",
      title: "AI-Powered Malware 'GhostWriter' Evades All Major Antivirus Vendors",
      summary: "Researchers at Elastic Security Labs have discovered a new AI-assisted malware generation framework that creates unique polymorphic payloads on each deployment, evading signature-based detection from 15 major AV vendors.",
      url: "https://example.com/news/ghostwriter-ai-malware",
      source: "Elastic Security Labs",
      publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      category: "Malware",
      tags: JSON.stringify(["AI Malware", "Evasion", "Polymorphic", "Antivirus"]),
      severity: "high",
      relatedCountries: JSON.stringify(["RU", "CN"]),
    },
  ];

  await db.insert(newsArticlesTable).values(articles).onConflictDoNothing();
  console.log(`Seeded ${articles.length} news articles.`);
}

async function seedThreatActors() {
  console.log("Seeding threat actors...");
  const actors = [
    {
      name: "Lazarus Group",
      alias: JSON.stringify(["HIDDEN COBRA", "Guardians of Peace", "APT38"]),
      originCountry: "North Korea",
      motivation: "Financial gain, espionage, and political disruption",
      recentActivity: "Targeting cryptocurrency exchanges and DeFi protocols with novel malware",
      targetSectors: JSON.stringify(["Finance", "Cryptocurrency", "Defense", "Government"]),
      threatLevel: "critical",
    },
    {
      name: "Sandworm",
      alias: JSON.stringify(["Voodoo Bear", "BlackEnergy", "Telebots", "APT44"]),
      originCountry: "Russia",
      motivation: "Destructive attacks and geopolitical espionage for Russian GRU",
      recentActivity: "Targeting Ukrainian critical infrastructure with Industroyer2 variants",
      targetSectors: JSON.stringify(["Energy", "Critical Infrastructure", "Government", "Military"]),
      threatLevel: "critical",
    },
    {
      name: "APT41",
      alias: JSON.stringify(["Winnti", "Double Dragon", "Barium", "Wicked Panda"]),
      originCountry: "China",
      motivation: "State-sponsored espionage combined with financial cybercrime",
      recentActivity: "Supply chain attacks targeting software development companies",
      targetSectors: JSON.stringify(["Technology", "Healthcare", "Telecommunications", "Gaming"]),
      threatLevel: "critical",
    },
    {
      name: "Scattered Spider",
      alias: JSON.stringify(["UNC3944", "Starfraud", "Muddled Libra"]),
      originCountry: "United States",
      motivation: "Financial gain through social engineering and ransomware deployment",
      recentActivity: "Targeting MGM Resorts and Caesars Palace with social engineering attacks",
      targetSectors: JSON.stringify(["Hospitality", "Finance", "Retail", "Telecommunications"]),
      threatLevel: "high",
    },
    {
      name: "Volt Typhoon",
      alias: JSON.stringify(["Bronze Silhouette", "Dev-0391", "VANGUARD PANDA"]),
      originCountry: "China",
      motivation: "Pre-positioning for potential disruption of US critical infrastructure",
      recentActivity: "Living-off-the-land attacks on US water systems, power grids, and ports",
      targetSectors: JSON.stringify(["Critical Infrastructure", "Military", "Utilities", "Transportation"]),
      threatLevel: "critical",
    },
  ];

  await db.insert(threatActorsTable).values(actors).onConflictDoNothing();
  console.log(`Seeded ${actors.length} threat actors.`);
}

async function seedCves() {
  console.log("Seeding CVE entries...");
  const cves = [
    {
      cveId: "CVE-2024-21762",
      cvssScore: 9.8,
      severity: "critical",
      description: "Fortinet FortiOS out-of-bounds write vulnerability in SSL-VPN allows unauthenticated remote code execution",
      affectedSoftware: "Fortinet FortiOS 6.0-7.4",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      exploitAvailable: true,
    },
    {
      cveId: "CVE-2024-20399",
      cvssScore: 9.3,
      severity: "critical",
      description: "Cisco IOS XE Software Web UI Privilege Escalation Vulnerability allows unauthenticated remote code execution",
      affectedSoftware: "Cisco IOS XE 17.x, 16.x",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      exploitAvailable: true,
    },
    {
      cveId: "CVE-2024-38080",
      cvssScore: 8.8,
      severity: "high",
      description: "Windows Hyper-V Elevation of Privilege Vulnerability allows local user to gain SYSTEM privileges",
      affectedSoftware: "Windows 10, Windows 11, Windows Server 2019/2022",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      exploitAvailable: true,
    },
    {
      cveId: "CVE-2024-3400",
      cvssScore: 10.0,
      severity: "critical",
      description: "PAN-OS command injection vulnerability in GlobalProtect Gateway allows unauthenticated OS command execution",
      affectedSoftware: "Palo Alto Networks PAN-OS 10.2, 11.0, 11.1",
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      exploitAvailable: true,
    },
    {
      cveId: "CVE-2024-1086",
      cvssScore: 7.8,
      severity: "high",
      description: "Linux kernel use-after-free vulnerability in netfilter allows local privilege escalation to root",
      affectedSoftware: "Linux Kernel 3.15-6.7",
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      exploitAvailable: true,
    },
  ];

  await db.insert(cveEntriesTable).values(cves).onConflictDoNothing();
  console.log(`Seeded ${cves.length} CVE entries.`);
}

async function main() {
  try {
    await seedThreats();
    await seedNews();
    await seedThreatActors();
    await seedCves();
    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

main();
