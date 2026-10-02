import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { RedisSmokeController } from "./redis/redis-smoke.controller.js";
import { redisClientProvider } from "./redis/redis.provider.js";

@Module({
  controllers: [AppController, RedisSmokeController],
  providers: [AppService, redisClientProvider],
  // exports: [AppService]
})
export class AppModule { }
