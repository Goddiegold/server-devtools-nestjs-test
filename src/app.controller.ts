import { Body, Controller, Get, HttpException, HttpStatus, Post } from "@nestjs/common";
import { AppService } from "./app.service.js";

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {
      console.log("AppService injected:", !!service); 
  }

  @Get("hello")
  hello() {
    return this.service.hello();
  }

  @Post("users")
  createUser(@Body() body: unknown) {
    return body;
  }

  @Get("slow")
  slow() {
    return this.service.slow();
  }

  @Get("not-found")
  notFound() {
    throw new HttpException({ error: "Not found" }, HttpStatus.NOT_FOUND);
  }

  @Get("external")
  external() {
    return this.service.external();
  }

  @Get("sensitive-test")
  sensitiveTest() {
    return this.service.sensitiveTest();
  }

  @Get("mongo-test")
  mongoTest() {
    return this.service.mongoTest();
  }

  @Get("error")
  error(): never {
    throw new Error("Intentional NestJS smoke-test error");
  }
}
