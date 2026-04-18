import http from "node:http";

const PORT = 3001;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/heartbeat") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

export { server, PORT };
