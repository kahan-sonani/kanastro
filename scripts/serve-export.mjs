import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve(import.meta.dirname, "../out");
const config = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".gz": "application/gzip",
};
await stat(root);
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    } catch {
      if (!extname(file)) file += ".html";
    }
    const bytes = await readFile(file);
    const headers = Object.fromEntries(
      config.headers[0].headers.map((item) => [item.key, item.value]),
    );
    response.writeHead(200, {
      ...headers,
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
    });
    response.end(bytes);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}).listen(4173, "127.0.0.1", () =>
  console.log("Local: http://127.0.0.1:4173/"),
);
