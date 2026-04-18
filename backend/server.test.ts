import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./server";

describe("GET /heartbeat", () => {
  it("returns 200 with the expected JSON shape", async () => {
    const res = await request(app).get("/heartbeat");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    // Verify timestamp is a valid ISO-8601 string
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
