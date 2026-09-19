import "dotenv/config";
import ServerDevTools from "server-devtools";

const encryptionKey = process.env.SERVER_DEVTOOLS_ENCRYPTION_KEY;
if (!encryptionKey) {
  throw new Error("SERVER_DEVTOOLS_ENCRYPTION_KEY is required for this smoke test");
}

export const devtools = new ServerDevTools({
  auth: {
    username: "admin",
    password: "12345678",
  },
  encryption: {
    key: encryptionKey,
    fields: ["password",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",]
  },
  getCurrentUser: (req) => {
    const user = req.user;
    return user && typeof user === "object" ? user : undefined;
  },
});

globalThis.__serverDevtools = devtools;
await devtools.start();
console.log("Started ServerDevTools successfully");
