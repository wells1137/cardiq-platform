import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initCronScheduler } from "../cronScheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Image proxy for external images with CORS restrictions
  app.get("/api/proxy-image", async (req, res) => {
    const url = req.query.url as string;
    if (!url) { res.status(400).send("Missing url"); return; }
    // Only allow known trusted domains
    const allowed = ["r2.thesportsdb.com", "www.thesportsdb.com", "a.espncdn.com", "cdn.nba.com"];
    let isAllowed = false;
    try { const parsed = new URL(url); isAllowed = allowed.some(d => parsed.hostname === d); } catch {}
    if (!isAllowed) { res.status(403).send("Domain not allowed"); return; }
    try {
      const https = await import("https");
      const http = await import("http");
      const protocol = url.startsWith("https") ? https : http;
      protocol.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (imgRes) => {
        res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.setHeader("Access-Control-Allow-Origin", "*");
        imgRes.pipe(res);
      }).on("error", () => res.status(502).send("Proxy error"));
    } catch { res.status(500).send("Server error"); }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });

  // 初始化定时扫描调度器（延迟 2s 等待 DB 连接就绪）
  setTimeout(() => {
    initCronScheduler().catch(err => console.error("[CronScheduler] Init failed:", err));
  }, 2000);
}

startServer().catch(console.error);
