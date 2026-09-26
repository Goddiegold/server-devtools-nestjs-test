var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, HttpException, HttpStatus, Post } from "@nestjs/common";
import { AppService } from "./app.service.js";
let AppController = class AppController {
    service;
    constructor(service) {
        this.service = service;
        console.log("AppService injected:", !!service);
    }
    hello() {
        return this.service.hello();
    }
    users() {
        return this.service.users();
    }
    postgresUsers() {
        return this.service.postgresUsers();
    }
    mysqlUsers() {
        return this.service.mysqlUsers();
    }
    createUser(body) {
        return body;
    }
    slow() {
        return this.service.slow();
    }
    notFound() {
        throw new HttpException({ error: "Not found" }, HttpStatus.NOT_FOUND);
    }
    external() {
        return this.service.external();
    }
    sensitiveTest() {
        return this.service.sensitiveTest();
    }
    mongoTest() {
        return this.service.mongoTest();
    }
    error() {
        throw new Error("Intentional NestJS smoke-test error");
    }
};
__decorate([
    Get("hello"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "hello", null);
__decorate([
    Get("users"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "users", null);
__decorate([
    Get("postgres-users"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "postgresUsers", null);
__decorate([
    Get("mysql-users"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "mysqlUsers", null);
__decorate([
    Post("users"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createUser", null);
__decorate([
    Get("slow"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "slow", null);
__decorate([
    Get("not-found"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "notFound", null);
__decorate([
    Get("external"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "external", null);
__decorate([
    Get("sensitive-test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "sensitiveTest", null);
__decorate([
    Get("mongo-test"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "mongoTest", null);
__decorate([
    Get("error"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "error", null);
AppController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [AppService])
], AppController);
export { AppController };
