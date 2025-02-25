import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./app/auth.js";
import users from "./app/users.js";
import legacyAuth from "./app/legacyAuth.js";

const app = new Hono();

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

app.route("/", auth);

app.route("/", users);

app.route("/", legacyAuth);

const port = 3000;

console.log(`Server is running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
