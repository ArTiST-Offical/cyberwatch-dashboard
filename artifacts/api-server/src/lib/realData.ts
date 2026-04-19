import Parser from "rss-parser";

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl?: string;
};

type CustomItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
  enclosure?: {
    url?: string;
  };
};

const rss: Parser<unknown, CustomItem> = new Parser({
  timeout: 8000,
  customFields: {
    item: ["media:content", "enclosure", "dc:creator", "description"],
  },
});

const FEEDS = [
  "https://feeds.feedburner.com/TheHackersNews",
  "https://www.bleepingcomputer.com/feed/",
  "https://krebsonsecurity.com/feed/",
];

export async function fetchRealNews(): Promise<NewsItem[]> {
  try {
    const allFeeds = await Promise.all(
      FEEDS.map((url) =>
        rss.parseURL(url).catch(() => null) // fail-safe
      )
    );

    const articles: NewsItem[] = [];

    for (const feed of allFeeds) {
      if (!feed || !feed.items) continue;

      for (const item of feed.items) {
        if (!item) continue;

        const description = (
          item.contentSnippet ||
          item.content ||
          item.description ||
          ""
        ).slice(0, 400);

        articles.push({
          title: item.title || "No title",
          link: item.link || "#",
          pubDate: item.pubDate || new Date().toISOString(),
          description,
          imageUrl: item.enclosure?.url || undefined,
        });
      }
    }

    // Sort latest first
    return articles
      .sort(
        (a, b) =>
          new Date(b.pubDate).getTime() -
          new Date(a.pubDate).getTime()
      )
      .slice(0, 20); // limit results
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}
