/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS startup file for the cPanel Node.js application. */

"use strict";

process.env.NODE_ENV = "production";

const http = require("node:http");
const next = require("next");

const rawPort = process.env.PORT || "3000";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid numeric port.");
}

const app = next({
  dev: false,
  dir: __dirname,
});

const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();

  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (error) {
      console.error("[gwc-newsletter] Request failed:", error);

      if (!res.headersSent) {
        res.statusCode = 500;

        res.setHeader("Content-Type", "text/plain; charset=utf-8");

        res.end("Internal server error");
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  });

  server.on("error", (error) => {
    console.error("[gwc-newsletter] Server error:", error);

    process.exit(1);
  });

  server.listen(port, () => {
    console.log("[gwc-newsletter] Production server started.");
  });
}

startServer().catch((error) => {
  console.error("[gwc-newsletter] Startup failed:", error);

  process.exit(1);
});
