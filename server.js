import { createServer as createHttpServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const http = createHttpServer;

const ASTRO_OUT = join(__dirname, "dist", "astro");
const TANSTACK_PORT = Number(process.env.TANSTACK_PORT || 3_000);
const TANSTACK_HOST = process.env.TANSTACK_HOST || `http://127.0.0.1:${TANSTACK_PORT}`;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

const server = createHttpServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith("/api")) {
    const proxyReq = http.request(`${TANSTACK_HOST}${pathname}${url.search}`, { method: req.method, headers: req.headers }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on("error", () => { res.writeHead(502); res.end("Proxy error"); });
    req.pipe(proxyReq);
    return;
  }

  if (pathname.startsWith("/_build") || pathname.startsWith("/assets")) {
    const filePath = join(ASTRO_OUT, pathname);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      const stream = createReadStream(filePath);
      res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
      stream.pipe(res);
      return;
    }
  }

  const filePath = join(ASTRO_OUT, pathname, "index.html");
  if (existsSync(filePath)) {
    const stream = createReadStream(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    stream.pipe(res);
    return;
  }

  const htmlPath = join(ASTRO_OUT, pathname.endsWith("/") ? `${pathname}index.html` : `${pathname}.html`);
  if (existsSync(htmlPath)) {
    const stream = createReadStream(htmlPath);
    res.writeHead(200, { "Content-Type": "text/html" });
    stream.pipe(res);
    return;
  }

  const httpRequest = http.request(`${TANSTACK_HOST}${pathname}${url.search}`, { method: req.method, headers: req.headers }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  httpRequest.on("error", () => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Not Found</h1>");
  });
});

const port = Number(process.env.PORT || 4_321);
server.listen(port, () => {
  console.log(`Unified proxy listening on http://localhost:${port}`);
  console.log(`  Astro SSR  -> ${ASTRO_OUT}`);
  console.log(`  TanStack   -> ${TANSTACK_HOST}`);
});
