import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import Redis, { type RedisOptions } from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

export function getRedisUrl(): string {
  return process.env.REDIS_URL ?? "redis://localhost:6379";
}

export function getRedisConnectionOptions(): string | RedisOptions {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (!process.env.REDIS_HOST) return getRedisUrl();

  const options: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  };
  if (process.env.REDIS_USER) options.username = process.env.REDIS_USER;
  if (process.env.REDIS_PASSWORD) options.password = process.env.REDIS_PASSWORD;
  if (process.env.REDIS_DB_INDEX) options.db = Number(process.env.REDIS_DB_INDEX);
  return options;
}

function createRedisClient(): Redis {
  const connection = getRedisConnectionOptions();
  console.log({ connection })
  return typeof connection === "string" ? new Redis(connection) : new Redis(connection);
}

@Injectable()
export class RedisProvider implements OnApplicationShutdown {
  readonly client = createRedisClient();

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}

export const redisClientProvider = {
  provide: REDIS_CLIENT,
  useClass: RedisProvider,
};
