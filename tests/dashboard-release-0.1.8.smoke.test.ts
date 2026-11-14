import assert from "node:assert/strict";
import "reflect-metadata";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test, type TestContext } from "node:test";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { IncomingMessage, ServerResponse } from "node:http";
import ServerDevTools from "server-devtools";
import { ServerDevToolsNestInterceptor } from "server-devtools/nestjs";

@Controller()
class NestSmokeController {
  @Get("hello")
  hello() {
    return { message: "Hello from NestJS" };
  }
}

@Module({ controllers: [NestSmokeController] })
class NestSmokeModule {}

const require = createRequire(import.meta.url);
const distSrcRoot = dirname(require.resolve("server-devtools"));
const packageInstallRoot = dirname(dirname(distSrcRoot));
const { isSlowSpan } = require(join(distSrcRoot, "core/slow-span.js")) as {
  isSlowSpan: (durationMs: unknown, thresholdMs?: number) => boolean;
};
const Config = require(join(distSrcRoot, "config/index.js")).default as {
  DASHBOARD_LOGIN_BODY_LIMIT_BYTES: number;
};

const AUTH = { username: "admin", password: "correct-password" } as const;

function useTemporaryWorkingDirectory(t: TestContext) {
  const previousDirectory = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), "nest-dashboard-smoke-"));
  process.chdir(directory);
  t.after(() => {
    process.chdir(previousDirectory);
    rmSync(directory, { recursive: true, force: true });
  });
}

async function startHttpHarness(
  t: TestContext,
  options: { allowedIPs?: string[]; slowSpanThresholdMs?: number; auth?: { username: string; password: string } } = {},
  hooks: { afterEach?: boolean } = { afterEach: true },
) {
  const devtools = new ServerDevTools({
    auth: options.auth ?? AUTH,
    allowedIPs: options.allowedIPs,
    slowSpanThresholdMs: options.slowSpanThresholdMs,
  });

  const server = http.createServer((req, res) => {
    devtools.middleware(req, res, () => {
      res.statusCode = 200;
      res.end("nest-app");
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const stop = async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    (devtools as unknown as { storage: { close: () => void } }).storage.close();
  };
  if (hooks.afterEach) {
    t.after(stop);
  }

  return { baseUrl, stop };
}

function postLogin(baseUrl: string, body: string) {
  return fetch(`${baseUrl}/_devtools/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal: AbortSignal.timeout(5000),
  });
}

async function loginCookie(baseUrl: string, username = AUTH.username, password = AUTH.password) {
  const response = await postLogin(baseUrl, JSON.stringify({ username, password }));
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  return setCookie.split(";")[0];
}

function countSessionRows(where = ""): number {
  const database = new DatabaseSync("./server-devtools.db");
  const row = database.prepare(`SELECT COUNT(*) AS count FROM sessions ${where}`).get() as { count: number };
  database.close();
  return row.count;
}

test("installed server-devtools is 0.1.8", () => {
  const pkg = JSON.parse(
    readFileSync(join(packageInstallRoot, "package.json"), "utf8"),
  ) as { version: string };
  assert.equal(pkg.version, "0.1.8");
});

test("nestjs export provides ServerDevToolsNestInterceptor", () => {
  assert.equal(typeof ServerDevToolsNestInterceptor, "function");
});

test("blocked IPs receive 403 on dashboard routes", async (t) => {
  useTemporaryWorkingDirectory(t);
  const { baseUrl } = await startHttpHarness(t, { allowedIPs: ["192.0.2.10"] });

  const response = await postLogin(baseUrl, JSON.stringify(AUTH));
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { message: "Forbidden" });
});

test("empty allowedIPs preserves dashboard access", async (t) => {
  useTemporaryWorkingDirectory(t);
  const { baseUrl } = await startHttpHarness(t, { allowedIPs: [] });
  assert.equal((await postLogin(baseUrl, JSON.stringify(AUTH))).status, 200);
});

test("sessions survive restart with unchanged credentials", async (t) => {
  useTemporaryWorkingDirectory(t);
  const first = await startHttpHarness(t, {}, { afterEach: false });
  const cookie = await loginCookie(first.baseUrl);
  await first.stop();

  const restarted = await startHttpHarness(t, {}, { afterEach: false });
  t.after(async () => {
    await restarted.stop();
  });
  assert.equal(countSessionRows(), 1);
  const response = await fetch(`${restarted.baseUrl}/_devtools/api/auth/profile`, { headers: { cookie } });
  assert.equal(response.status, 200);
});

test("login rate limit returns 429 on sixth failure", async (t) => {
  useTemporaryWorkingDirectory(t);
  const { baseUrl } = await startHttpHarness(t);
  const wrong = JSON.stringify({ username: "admin", password: "wrong" });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await postLogin(baseUrl, wrong)).status, 401);
  }

  const blocked = await postLogin(baseUrl, wrong);
  assert.equal(blocked.status, 429);
});

test("rejects oversized login bodies with 413", async (t) => {
  useTemporaryWorkingDirectory(t);
  const { baseUrl } = await startHttpHarness(t);
  const oversized = JSON.stringify({
    username: "admin",
    password: "wrong",
    padding: "x".repeat(Config.DASHBOARD_LOGIN_BODY_LIMIT_BYTES),
  });
  assert.equal((await postLogin(baseUrl, oversized)).status, 413);
});

test("NestJS application routes remain reachable alongside devtools middleware", async (t) => {
  useTemporaryWorkingDirectory(t);
  const devtools = new ServerDevTools({
    auth: AUTH,
    allowedIPs: ["192.0.2.10"],
  });

  const app = await NestFactory.create(NestSmokeModule, { logger: false });
  app.useGlobalInterceptors(new ServerDevToolsNestInterceptor());
  app.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    devtools.middleware(req, res, next);
  });

  const server = await app.listen(0, "127.0.0.1");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  t.after(async () => {
    await app.close();
    (devtools as unknown as { storage: { close: () => void } }).storage.close();
  });

  const hello = await fetch(`${baseUrl}/hello`);
  assert.equal(hello.status, 200);

  const login = await postLogin(baseUrl, JSON.stringify(AUTH));
  assert.equal(login.status, 403);
});

test("exposes configured slowSpanThresholdMs from the config API", async (t) => {
  useTemporaryWorkingDirectory(t);
  const { baseUrl } = await startHttpHarness(t, { slowSpanThresholdMs: 275, allowedIPs: ["127.0.0.1"] });
  const cookie = await loginCookie(baseUrl);
  const response = await fetch(`${baseUrl}/_devtools/api/config`, { headers: { cookie } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { slowSpanThresholdMs: 275 });
});

test("isSlowSpan flags leaf durations without inferring slowness from parents", () => {
  assert.equal(isSlowSpan(50), false);
  assert.equal(isSlowSpan(900), true);
});