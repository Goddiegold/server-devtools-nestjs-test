import { Controller, Get, Inject } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT, RedisProvider } from "./redis.provider.js";

const KEY_PREFIX = "serverdevtools:smoke:";
const STRING_TTL_SECONDS = 30;
const EXPIRY_WAIT_MS = 75;

function key(name: string): string {
  return `${KEY_PREFIX}${name}:${crypto.randomUUID()}`;
}

function checkCommandResults(
  results: Array<[Error | null, unknown]>,
): unknown[] {
  for (const [error] of results) {
    if (error) throw error;
  }
  return results.map(([, result]) => result);
}

@Controller("redis")
export class RedisSmokeController {
  private readonly redis: Redis;

  constructor(@Inject(REDIS_CLIENT) redisProvider: RedisProvider) {
    this.redis = redisProvider.client;
  }

  @Get("string")
  async string() {
    const redisKey = key("string");
    try {
      await this.redis.set(redisKey, "hello", "EX", STRING_TTL_SECONDS);
      return { value: await this.redis.get(redisKey) };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("missing")
  async missing() {
    const redisKey = key("missing");
    return { value: await this.redis.get(redisKey) };
  }

  @Get("hash")
  async hash() {
    const redisKey = key("hash");
    try {
      await this.redis.hset(redisKey, { field: "value" });
      return { value: await this.redis.hgetall(redisKey) };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("list")
  async list() {
    const redisKey = key("list");
    try {
      await this.redis.rpush(redisKey, "first", "second");
      return { value: await this.redis.lrange(redisKey, 0, -1) };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("set")
  async set() {
    const redisKey = key("set");
    try {
      await this.redis.sadd(redisKey, "one", "two");
      return { value: (await this.redis.smembers(redisKey)).sort() };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("sorted-set")
  async sortedSet() {
    const redisKey = key("sorted-set");
    try {
      await this.redis.zadd(redisKey, 1, "one", 2, "two");
      return { value: await this.redis.zrange(redisKey, 0, "-1", "WITHSCORES") };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("pipeline")
  async pipeline() {
    const redisKey = key("pipeline");
    try {
      const results = await this.redis
        .pipeline()
        .set(redisKey, "pipeline-value", "EX", STRING_TTL_SECONDS)
        .get(redisKey)
        .exists(redisKey)
        .exec();
      return { value: checkCommandResults(results ?? []) };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("transaction")
  async transaction() {
    const redisKey = key("transaction");
    try {
      const results = await this.redis
        .multi()
        .set(redisKey, "transaction-value", "EX", STRING_TTL_SECONDS)
        .get(redisKey)
        .exists(redisKey)
        .exec();
      return { value: checkCommandResults(results ?? []) };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("expired")
  async expired() {
    const redisKey = key("expired");
    try {
      await this.redis.set(redisKey, "short-lived", "PX", EXPIRY_WAIT_MS);
      await new Promise((resolve) => setTimeout(resolve, EXPIRY_WAIT_MS + 25));
      return { value: await this.redis.get(redisKey) };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  @Get("failed")
  async failed() {
    await this.redis.call("SERVERDEVTOOLS_INVALID_COMMAND");
    return { value: "unreachable" };
  }

  @Get("wrong-type")
  async wrongType() {
    const redisKey = key("wrong-type");
    try {
      await this.redis.set(redisKey, "string", "EX", STRING_TTL_SECONDS);
      await this.redis.lpush(redisKey, "not-a-list");
      return { value: "unreachable" };
    } finally {
      await this.cleanup(redisKey);
    }
  }

  private async cleanup(redisKey: string): Promise<void> {
    await this.redis.del(redisKey).catch(() => undefined);
  }
}
