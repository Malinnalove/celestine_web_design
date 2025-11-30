import { createClient } from "@libsql/client";

// Centralized Turso/libSQL client. Keep this on the server side.
if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in environment variables");
}

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export default client;
