import "reflect-metadata";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import { ServerDevToolsNestInterceptor } from "server-devtools/nestjs";
import { AppModule } from "./app.module.js";
import ServerDevTools from "server-devtools";
// import { devtools } from "../server-devtools.js";

type SmokeUser = { id: string; email: string; name: string };
type RequestWithUser = IncomingMessage & { user?: SmokeUser };

declare global {
  var __serverDevtools: ServerDevTools | undefined;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalInterceptors(new ServerDevToolsNestInterceptor());
  app.use((req: IncomingMessage, _res: ServerResponse, next: () => void) => {
    (req as RequestWithUser).user = {
      id: "user-123",
      email: "smoke@example.com",
      name: "Smoke User",
    };
    next();
  });

  const devtools = globalThis.__serverDevtools;
  if (devtools) {

    app.use(
      (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void,
      ) => devtools.middleware(req, res, next),
    );
  }


  app.enableCors();
  await app.listen(4000);
  console.log("NestJS smoke app listening on http://localhost:4000");
}

bootstrap();
