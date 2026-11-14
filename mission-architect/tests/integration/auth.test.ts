import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { app } from "../../apps/api/src/app";

let server: ReturnType<typeof app.listen>;
let base = "";

before(() => {
  server = app.listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const get = (path: string, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: "GET",
    headers,
  });

test("AUTH: login with pre-seeded demo commander account succeeds", async () => {
  const res = await post("/api/auth/login", {
    username: "commander",
    password: "spaceapps2026",
  });
  assert.equal(res.status, 200);
  const data = (await res.json()) as any;
  assert.equal(data.user.username, "commander");
  assert.equal(typeof data.token, "string");
  assert(data.token.startsWith("tok_"));
});

test("AUTH: login with wrong password fails with 401 INVALID_CREDENTIALS", async () => {
  const res = await post("/api/auth/login", {
    username: "commander",
    password: "wrongpassword",
  });
  assert.equal(res.status, 401);
  const data = (await res.json()) as any;
  assert.equal(data.error.code, "INVALID_CREDENTIALS");
});

test("AUTH: register new space cadet account and retrieve profile", async () => {
  const username = `cadet_${Date.now()}`;
  const res = await post("/api/auth/register", {
    username,
    password: "orbitSecretPassword!",
    callsign: "Apollo Gold",
  });
  assert.equal(res.status, 201);
  const data = (await res.json()) as any;
  assert.equal(data.user.username, username);
  assert.equal(data.user.callsign, "Apollo Gold");
  assert(data.token.startsWith("tok_"));

  // Verify /api/auth/me returns this user
  const meRes = await get("/api/auth/me", {
    authorization: `Bearer ${data.token}`,
  });
  assert.equal(meRes.status, 200);
  const meData = (await meRes.json()) as any;
  assert.equal(meData.user.username, username);
  assert.equal(meData.user.callsign, "Apollo Gold");
});

test("AUTH: registering duplicate username returns 409 USER_EXISTS", async () => {
  const res = await post("/api/auth/register", {
    username: "commander",
    password: "anotherpassword123",
  });
  assert.equal(res.status, 409);
  const data = (await res.json()) as any;
  assert.equal(data.error.code, "USER_EXISTS");
});

test("AUTH: short password (< 6 chars) fails with 400 VALIDATION_ERROR", async () => {
  const res = await post("/api/auth/register", {
    username: "pilot_short",
    password: "123",
  });
  assert.equal(res.status, 400);
  const data = (await res.json()) as any;
  assert.equal(data.error.code, "VALIDATION_ERROR");
});

test("AUTH: logout revokes active session token", async () => {
  // Login first
  const loginRes = await post("/api/auth/login", {
    username: "commander",
    password: "spaceapps2026",
  });
  const { token } = (await loginRes.json()) as any;

  // Logout
  const logoutRes = await post(
    "/api/auth/logout",
    {},
    { authorization: `Bearer ${token}` }
  );
  assert.equal(logoutRes.status, 200);

  // Now /api/auth/me should fail with 401
  const meRes = await get("/api/auth/me", {
    authorization: `Bearer ${token}`,
  });
  assert.equal(meRes.status, 401);
});
