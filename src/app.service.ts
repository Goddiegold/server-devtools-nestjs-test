import { Injectable } from "@nestjs/common";
import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    source: { type: String, required: true },
  },
  { collection: "users", timestamps: false },
);
const UserModel = mongoose.model("NestSmokeUser", userSchema);

@Injectable()
export class AppService {
  hello() {
    return { message: "Hello from NestJS" };
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

    return document;
  }
}
