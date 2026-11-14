import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Redis from "ioredis";
import mongoose from "mongoose";
import mysql from "mysql2/promise";
import { Pool } from "pg";

const POSTGRES_URL = "postgresql://mac@localhost:5432/server_devtools_test";
const MYSQL_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "devtools",
  password: "devtools",
  database: "server_devtools_test",
};
const MONGO_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

async function assertReachable(label: string, probe: () => Promise<void>) {
  try {
    await probe();
  } catch (error) {
    assert.fail(
      `INFRA BLOCKER (${label}): service unreachable — start the smoke database/Redis stack and retry. ${error}`,
    );
  }
}

test("PostgreSQL is reachable for tracing smoke", async () => {
  const pool = new Pool({ connectionString: POSTGRES_URL });
  try {
    await assertReachable("PostgreSQL", async () => {
      await pool.query("SELECT 1");
    });
  } finally {
    await pool.end();
  }
});

test("MySQL is reachable for tracing smoke", async () => {
  const pool = mysql.createPool(MYSQL_CONFIG);
  try {
    await assertReachable("MySQL", async () => {
      await pool.query("SELECT 1");
    });
  } finally {
    await pool.end();
  }
});

test("MongoDB is reachable for tracing smoke", async () => {
  await assertReachable("MongoDB", async () => {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    await mongoose.connection.db?.command({ ping: 1 });
    await mongoose.disconnect();
  });
});

test("Redis is reachable for tracing smoke", async () => {
  const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  try {
    await assertReachable("Redis", async () => {
      const pong = await redis.ping();
      assert.equal(pong, "PONG");
    });
  } finally {
    redis.disconnect();
  }
});