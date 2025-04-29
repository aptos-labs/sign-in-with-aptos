/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed */
import {
  Ed25519Account,
  Ed25519Signature,
  type PublicKey,
} from "@aptos-labs/ts-sdk";
import type {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";
import { describe, expect, test } from "vitest";
import {
  createLegacySignInMessage,
  verifyLegacySignIn,
} from "../../src/legacy/index.js";
import { ed25519Account } from "../lib/constants.js";
import { createLegacyFullMessage } from "../lib/helpers.js";

const defaultFieldsInput = {
  domain: "example.com",
  uri: "https://example.com",
  address: ed25519Account.accountAddress.toString(),
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123",
} satisfies AptosSignInInput & AptosSignInRequiredFields;

describe("verifySignInSignature", () => {
  const publicKey = ed25519Account.publicKey;

  test("verifies valid signature and message", async () => {
    const fullMessage = createLegacyFullMessage({
      message: createLegacySignInMessage(defaultFieldsInput),
    });

    const result = await verifyLegacySignIn(defaultFieldsInput, {
      publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      message: fullMessage,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toMatchInlineSnapshot(`
      {
        "address": "0x983bb18e768a1f736b6f0011a65833243fa7e3bf908b7f9535b1049d8307f328",
        "chainId": "aptos:mainnet",
        "domain": "example.com",
        "nonce": "abc123",
        "uri": "https://example.com",
        "version": "1",
      }
    `);
    }
  });

  test("fails when signature is invalid with more fields", async () => {
    const fullMessage = createLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
        resources: ["resource1", "resource2"],
      }),
    });

    const result = await verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      message: fullMessage,
    });

    expect(result.valid).toBe(false);
  });

  test("fails when signature is invalid with less fields", async () => {
    const fullMessage = createLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
        nonce: undefined,
      } as any),
    });

    const result = await verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      message: fullMessage,
    });

    expect(result.valid).toBe(false);
  });

  test("fails when signature is invalid", async () => {
    const fullMessage = createLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
      }),
    });

    const result = await verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: new Ed25519Signature(new Uint8Array(64)),
      message: fullMessage,
    });

    expect(result.valid).toBe(false);
  });

  test("fails when public key is invalid", async () => {
    const fullMessage = createLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
      }),
    });

    const result = await verifyLegacySignIn(defaultFieldsInput, {
      publicKey: {} as PublicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      message: fullMessage,
    });

    expect(result.valid).toBe(false);
  });

  test("fails when public key's auth key does not match message address", async () => {
    const account = Ed25519Account.generate();

    const fullMessage = createLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
      }),
    });

    const result = await verifyLegacySignIn(defaultFieldsInput, {
      publicKey: account.publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      message: fullMessage,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_auth_key"]);
  });
});
