import type { AptosSignInInput } from "@aptos-labs/wallet-standard";
import { zValidator } from "@hono/zod-validator";
import {
  generateNonce,
  deserializeSignInPublicKey,
  deserializeSignInSignature,
  verifySignIn,
} from "@aptos-labs/siwa";
import { getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { z } from "zod";
import { createSession, generateSessionToken } from "../lib/sessions.js";
import { createUserByAddress, getUserByAddress } from "../lib/users.js";

const auth = new Hono();

auth.get("/auth/siwa", (c) => {
  const nonce = generateNonce();
  const input = {
    nonce,
    statement: "Sign into to get access to this demo application",
  } satisfies AptosSignInInput;
  setCookie(c, "siwa-input", JSON.stringify(input), {
    httpOnly: true,
    sameSite: "lax",
  });
  return c.json({ data: input });
});

auth.get("/auth/siwa/error", (c) => {
  const nonce = generateNonce();
  const input = {
    nonce,
    uri: "https://instagram.com/",
    statement: "Sign into to get access to this demo application",
  } satisfies AptosSignInInput;
  setCookie(c, "siwa-input", JSON.stringify(input), {
    httpOnly: true,
    sameSite: "lax",
  });
  return c.json({ data: input });
});

auth.post(
  "/auth/siwa/callback",
  zValidator(
    "json",
    z.object({
      type: z.enum(["ed25519", "multi_ed25519", "single_key", "multi_key"]),
      signature: z.string(),
      message: z.string(),
      publicKey: z.string(),
    })
  ),
  async (c) => {
    const { type, signature, message, publicKey } = c.req.valid("json");

    const input = getCookie(c, "siwa-input");
    if (!input) return c.json({ error: "input_not_found" }, 400);

    const verification = verifySignIn(
      {
        ...(JSON.parse(input) as AptosSignInInput),
        domain: "https://localhost:5173",
      },
      {
        publicKey: deserializeSignInPublicKey(type, publicKey),
        signature: deserializeSignInSignature(type, signature),
        message,
      }
    );

    if (!verification.valid) {
      return c.json({ error: `${verification.errors.join(", ")}` }, 400);
    }

    let user = await getUserByAddress(verification.data.address);
    if (!user) user = await createUserByAddress(verification.data.address);

    const token = generateSessionToken();
    await createSession(token, verification.data.address);

    setCookie(c, "session", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    return c.json({ data: true });
  }
);

export default auth;
