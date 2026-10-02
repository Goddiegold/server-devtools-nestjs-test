import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getRedisConnectionOptions,
  getRedisUrl,
  redisClientProvider,
} from "../src/redis/redis.provider.js";

test("redis provider uses the documented default URL", () => {
  const originalUrl = process.env.REDIS_URL;
  delete process.env.REDIS_URL;

  try {
    assert.equal(redisClientProvider.provide, "REDIS_CLIENT");
    assert.equal(getRedisUrl(), "redis://localhost:6379");
    assert.equal(redisClientProvider.useClass.name, "RedisProvider");
  } finally {
    if (originalUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalUrl;
  }
});

test("redis provider uses component credentials when REDIS_URL is absent", () => {
  const original = { ...process.env };
  delete process.env.REDIS_URL;
  process.env.REDIS_HOST = "redis.example.test";
  process.env.REDIS_PORT = "6380";
  process.env.REDIS_USER = "smoke-user";
  process.env.REDIS_PASSWORD = "p@ss:word";
  process.env.REDIS_DB_INDEX = "4";

  try {
    assert.deepEqual(getRedisConnectionOptions(), {
      host: "redis.example.test",
      port: 6380,
      username: "smoke-user",
      password: "p@ss:word",
      db: 4,
    });
  } finally {
    for (const name of [
      "REDIS_URL",
      "REDIS_HOST",
      "REDIS_PORT",
      "REDIS_USER",
      "REDIS_PASSWORD",
      "REDIS_DB_INDEX",
    ]) {
      delete process.env[name];
    }
    Object.assign(process.env, original);
  }
});
