var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import mongoose from "mongoose";
import mysql from "mysql2/promise";
import { Pool } from "pg";
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    source: { type: String, required: true },
}, { collection: "users", timestamps: false });
const UserModel = mongoose.model("NestSmokeUser", userSchema);
const postgresPool = new Pool({
    connectionString: "postgresql://mac@localhost:5432/server_devtools_test",
});
const mysqlPool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "devtools",
    password: "devtools",
    database: "server_devtools_test",
});
let AppService = class AppService {
    hello() {
        return { message: "Hello from NestJS" };
    }
    users() {
        return [{ id: "user-123", email: "smoke@example.com", name: "Smoke User" }];
    }
    async postgresUsers() {
        const result = await postgresPool.query("SELECT * FROM users");
        return result.rows;
    }
    async mysqlUsers() {
        const [rows] = await mysqlPool.query("SELECT * FROM users");
        return rows;
    }
    async slow() {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { message: "Finished waiting" };
    }
    async external() {
        const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
        return response.json();
    }
    async sensitiveTest() {
        const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            headers: {
                Authorization: "Bearer smoke-test-secret-token",
                Cookie: "session=smoke-test-cookie",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                username: "smoke-user",
                password: "smoke-test-password",
                accessToken: "smoke-test-access-token",
            }),
        });
        return { status: response.status, body: await response.json() };
    }
    async mongoTest() {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(mongoUri, { dbName: "server_devtools_smoke" });
        }
        let document = await UserModel.findOne({ name: "ServerDevTools Mongoose Test" });
        if (!document) {
            document = await UserModel.create({
                name: "ServerDevTools Mongoose Test",
                source: "nest",
            });
        }
        const externalResponse = await fetch("https://jsonplaceholder.typicode.com/todos/1");
        return { document, external: await externalResponse.json() };
    }
};
AppService = __decorate([
    Injectable()
], AppService);
export { AppService };
