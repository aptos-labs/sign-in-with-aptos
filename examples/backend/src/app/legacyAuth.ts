import {
  type AptosSignInInput,
  type AptosSignInRequiredFields,
  deserializeSignInOutput,
  generateNonce,
  verifySignIn,
} from "@aptos-labs/siwa";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { generateSessionToken, createSession } from "../lib/sessions.js";
import { getUserByAddress, createUserByAddress } from "../lib/users.js";
import { verifyLegacySignIn } from "@aptos-labs/siwa/legacy";

const legacyAuth = new Hono();

legacyAuth.get(
  "/auth/legacy/siwa",
  zValidator("query", z.object({ address: z.string() })),
  (c) => {
    const { address } = c.req.valid("query");

    const nonce = generateNonce();

    const input = {
      nonce,
      statement: "Sign into to get access to this demo application",
      domain: "localhost:5173",
      address,
      uri: "https://localhost:5173",
      version: "1",
      chainId: "aptos:mainnet",
    } satisfies AptosSignInInput & AptosSignInRequiredFields;

    setCookie(c, "siwa-input", JSON.stringify(input), {
      httpOnly: true,
      sameSite: "lax",
    });

    return c.json({ data: input });
  },
);

legacyAuth.post(
  "/auth/siwa/legacy/callback",
  zValidator(
    "json",
    z.object({
      output: z.object({
        version: z.enum(["1"]),
        type: z.enum(["ed25519", "multi_ed25519", "single_key", "multi_key"]),
        signature: z.string(),
        message: z.string(),
        publicKey: z.string(),
      }),
    }),
  ),
  async (c) => {
    const { output } = c.req.valid("json");

    const input = getCookie(c, "siwa-input");
    if (!input) return c.json({ error: "input_not_found" }, 400);

    const deserializedOutput = deserializeSignInOutput(output);

    const verification = verifyLegacySignIn(
      JSON.parse(input) as AptosSignInInput & AptosSignInRequiredFields,
      deserializedOutput,
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
  },
);

export default legacyAuth;
