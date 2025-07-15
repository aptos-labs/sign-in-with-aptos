import {
  type AptosSignInInput,
  deserializeSignInOutput,
  generateNonce,
  verifySignInMessage,
  verifySignInSignature,
} from "@aptos-labs/siwa";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { createSession, generateSessionToken } from "../lib/sessions.js";
import { createUserByAddress, getUserByAddress } from "../lib/users.js";

const auth = new Hono();

auth.get("/auth/siwa", (c) => {
  const nonce = generateNonce();
  const input = {
    nonce,
    domain: "localhost:5173",
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
      output: z.object({
        version: z.enum(["2"]),
        type: z.enum(["ed25519", "multi_ed25519", "single_key", "multi_key"]),
        signature: z.string(),
        publicKey: z.string(),
        input: z.object({
          address: z.string(),
          nonce: z.string(),
          domain: z.string(),
          uri: z.string(),
          statement: z.string(),
          version: z.string(),
          chainId: z.string(),
        }),
      }),
    }),
  ),
  async (c) => {
    const { output } = c.req.valid("json");

    const expectedInput = getCookie(c, "siwa-input");
    if (!expectedInput) return c.json({ error: "input_not_found" }, 400);

    const deserializedOutput = deserializeSignInOutput(output);

    const signatureVerification =
      await verifySignInSignature(deserializedOutput);

    if (!signatureVerification.valid) {
      return c.json(
        { error: `${signatureVerification.errors.join(", ")}` },
        400,
      );
    }

    const messageVerification = await verifySignInMessage({
      input: deserializedOutput.input,
      expected: JSON.parse(expectedInput) as AptosSignInInput,
      publicKey: deserializedOutput.publicKey,
    });

    if (!messageVerification.valid) {
      return c.json({ error: `${messageVerification.errors.join(", ")}` }, 400);
    }

    let user = await getUserByAddress(deserializedOutput.input.address);
    if (!user) {
      user = await createUserByAddress(deserializedOutput.input.address);
    }

    const token = generateSessionToken();
    await createSession(token, deserializedOutput.input.address);

    setCookie(c, "session", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    return c.json({ data: true });
  },
);

auth.get("/auth/siwa/error", (c) => {
  const nonce = generateNonce();
  const input = {
    nonce,
    domain: "localhost:5173",
    uri: "https://instagram.com/",
    statement: "Sign into to get access to this demo application",
  } satisfies AptosSignInInput;
  setCookie(c, "siwa-input", JSON.stringify(input), {
    httpOnly: true,
    sameSite: "lax",
  });
  return c.json({ data: input });
});

export default auth;
