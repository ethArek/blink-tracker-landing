const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = 4173;
const ROOT_DIR = path.resolve(__dirname, "..");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  return MIME_TYPES[extension] ?? "application/octet-stream";
}

function toFilePath(requestUrl) {
  const normalizedUrl = new URL(requestUrl, `http://${HOST}:${PORT}`);
  let pathname = normalizedUrl.pathname;

  if (pathname === "/") {
    pathname = "/index.html";
  }
  const resolvedPath = path.resolve(ROOT_DIR, `.${pathname}`);
  const relativePath = path.relative(ROOT_DIR, resolvedPath);
  const isOutsideRoot = relativePath === ".." || relativePath.startsWith(`..${path.sep}`);
  if (isOutsideRoot || path.isAbsolute(relativePath)) {
    return null;
  }

  return resolvedPath;
}

async function readFile(filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return null;
    }

    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

const server = http.createServer(async (request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
    return;
  }
  const filePath = toFilePath(request.url ?? "/");
  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }
  const fileContent = await readFile(filePath);
  if (!fileContent) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": getContentType(filePath) });
  if (method === "HEAD") {
    response.end();
    return;
  }
  response.end(fileContent);
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Static server running at http://${HOST}:${PORT}\n`);
});
