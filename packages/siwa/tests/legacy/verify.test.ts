import { Ed25519Signature } from "@aptos-labs/ts-sdk";
import type {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";
import { describe, expect, test } from "vitest";
import {
  createLegacySignInMessage,
  verifyLegacySignIn,
} from "../../src/legacy.js";
import { ed25519Account } from "../lib/constants.js";
import { creageLegacyFullMessage } from "../lib/helpers.js";

const defaultFieldsInput = {
  domain: "example.com",
  uri: "https://example.com",
  address: "0x0000000000000000000000000000000000000000000000000000000000000001",
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123",
} satisfies AptosSignInInput & AptosSignInRequiredFields;

describe("verifySignIn", () => {
  const publicKey = ed25519Account.publicKey;

  test("verifies valid signature and message", () => {
    const fullMessage = creageLegacyFullMessage({
      message: createLegacySignInMessage(defaultFieldsInput),
    });

    const result = verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      fullMessage: fullMessage,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "chainId": "aptos:mainnet",
        "domain": "example.com",
        "nonce": "abc123",
        "uri": "https://example.com",
        "version": "1",
      }
    `);
    }
  });

  test("fails when signature is invalid with more fields", () => {
    const fullMessage = creageLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
        resources: ["resource1", "resource2"],
      }),
    });

    const result = verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      fullMessage: fullMessage,
    });

    expect(result.valid).toBe(false);
  });

  test("fails when signature is invalid with less fields", () => {
    const fullMessage = creageLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
        nonce: undefined,
      } as any),
    });

    const result = verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(new TextEncoder().encode(fullMessage)),
      fullMessage: fullMessage,
    });

    expect(result.valid).toBe(false);
  });

  test("fails when signature is invalid", () => {
    const fullMessage = creageLegacyFullMessage({
      message: createLegacySignInMessage({
        ...defaultFieldsInput,
      }),
    });

    const result = verifyLegacySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: new Ed25519Signature(new Uint8Array(64)),
      fullMessage: fullMessage,
    });

    expect(result.valid).toBe(false);
  });
});
