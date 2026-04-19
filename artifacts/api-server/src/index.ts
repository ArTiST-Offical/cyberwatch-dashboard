import app from "./app";
import { logger } from "./lib/logger";
import { fetchFeodoThreats, fetchKevThreats, fetchRealNews, fetchRecentCves } from "./lib/realData";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Pre-warm real-data caches in background so first user request is instant
  Promise.all([
    fetchFeodoThreats().catch(e => logger.warn({ err: e }, "Feodo prewarm failed")),
    fetchKevThreats().catch(e => logger.warn({ err: e }, "KEV prewarm failed")),
    fetchRealNews(60).catch(e => logger.warn({ err: e }, "News prewarm failed")),
    fetchRecentCves().catch(e => logger.warn({ err: e }, "CVE prewarm failed")),
  ]).then(() => logger.info("Real-data caches pre-warmed")).catch(() => null);
});
