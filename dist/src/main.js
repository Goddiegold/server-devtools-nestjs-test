import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ServerDevToolsNestInterceptor } from "server-devtools/nestjs";
import { AppModule } from "./app.module.js";
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(new ServerDevToolsNestInterceptor());
    app.use((req, _res, next) => {
        req.user = {
            id: "user-123",
            email: "smoke@example.com",
            name: "Smoke User",
        };
        next();
    });
    const devtools = globalThis.__serverDevtools;
    if (devtools) {
        app.use((req, res, next) => devtools.middleware(req, res, next));
    }
    app.enableCors();
    await app.listen(4000);
    console.log("NestJS smoke app listening on http://localhost:4000");
}
bootstrap();
