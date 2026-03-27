import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot/index";

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

// 🔥 BURASI DÜZELTİLDİ
app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
  startSelfPing(port);
});

startBot().catch((err) => {
  logger.error({ err }, "Failed to start Discord bot");
});

function startSelfPing(serverPort: number): void {
  const devDomain = process.env["REPLIT_DEV_DOMAIN"];
  const pingUrl = devDomain
    ? `https://${devDomain}/api/healthz`
    : `http://localhost:${serverPort}/api/healthz`;

  const PING_INTERVAL_MS = 4 * 60 * 1000;

  setInterval(async () => {
    try {
      const res = await fetch(pingUrl);
      if (!res.ok) {
        logger.warn({ status: res.status }, "Self-ping returned non-OK status");
      }
    } catch (err) {
      logger.warn({ err }, "Self-ping failed");
    }
  }, PING_INTERVAL_MS);

  logger.info({ pingUrl, intervalMinutes: 4 }, "Self-ping started");
}
