import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { invalidateSession, validateSessionToken } from "../lib/sessions.js";
import { db, userTable } from "../db.js";
import { eq } from "drizzle-orm";

const users = new Hono();

users.get("/user", async (c) => {
  const { user } = await validateSessionToken(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  return c.json({ data: user });
});

users.put(
  "/user",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      favoriteColor: z.string().optional(),
    })
  ),
  async (c) => {
    const { user } = await validateSessionToken(c);
    if (!user) return c.json({ error: "unauthorized" }, 401);

    const { name, favoriteColor } = c.req.valid("json");

    await db
      .update(userTable)
      .set({
        name: name ?? user.name,
        favoriteColor: favoriteColor ?? user.favoriteColor,
      })
      .where(eq(userTable.id, user.id));

    return c.json({ data: true });
  }
);

users.post("/user/logout", async (c) => {
  const { session } = await validateSessionToken(c);
  if (!session) return c.json({ error: "unauthorized" }, 401);
  await invalidateSession(session.id);
  return c.json({ data: true });
});

export default users;
