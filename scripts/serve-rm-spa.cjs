// SPA server for the RM export: serves real files; for unknown paths (e.g. /5/)
// serves index.html with <base href="/"> injected so relative assets resolve.
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = "C:/Users/erick/Downloads/RM/PJ";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".json": "application/json", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".mp4": "video/mp4" };
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const fp = path.join(ROOT, p);
  if (p !== "/" && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    res.writeHead(200, { "content-type": types[path.extname(fp)] || "application/octet-stream" });
    return res.end(fs.readFileSync(fp));
  }
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (!/<base /i.test(html)) html = html.replace(/<head([^>]*)>/i, '<head$1><base href="/">');
  res.writeHead(200, { "content-type": "text/html" });
  res.end(html);
}).listen(8092, () => console.log("rm-spa on http://localhost:8092"));
