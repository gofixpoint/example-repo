import http from "node:http";
import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";

let server;
const PORT = 0; // use random available port
let baseUrl;

before(async () => {
  server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/heartbeat") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });

  await new Promise((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
});

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on("error", reject);
  });
}

describe("GET /heartbeat", () => {
  it("returns 200 with status and timestamp", async () => {
    const { status, body } = await get("/heartbeat");
    assert.equal(status, 200);
    assert.equal(body.status, "ok");
    assert.equal(typeof body.timestamp, "string");
    // Verify it's a valid ISO-8601 timestamp
    assert.ok(!isNaN(Date.parse(body.timestamp)), "timestamp should be valid ISO-8601");
  });
});
