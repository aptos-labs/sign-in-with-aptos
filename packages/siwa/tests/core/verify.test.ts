import { describe, expect, test } from "vitest";
import {
  createSignInMessageText,
  verifySignInMessage,
  verifySignInSignature,
  generateSignInSigningMessage,
} from "../../src/core.js";
import {
  Ed25519Account,
  Ed25519Signature,
  Network,
  AptosConfig,
  type PublicKey,
} from "@aptos-labs/ts-sdk";
import { ed25519Account } from "../lib/constants.js";
import type {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";

const defaultFieldsInput = {
  domain: "example.com",
  uri: "https://example.com",
  address: ed25519Account.accountAddress.toString(),
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123",
} satisfies AptosSignInInput & AptosSignInRequiredFields;

const extraFieldsInput = {
  ...defaultFieldsInput,
  statement: "Sign in to Example.com",
  nonce: "abc123",
  issuedAt: "2023-01-01T00:00:00Z",
  expirationTime: "2024-01-01T00:00:00Z",
  notBefore: "2023-01-01T00:00:00Z",
  requestId: "req123",
  resources: ["resource1", "resource2"],
} satisfies AptosSignInInput & AptosSignInRequiredFields;

describe("verifySignInMessage", () => {
  test("verifies matching input and string message", async () => {
    const result = await verifySignInMessage({
      expected: defaultFieldsInput,
      message: createSignInMessageText(defaultFieldsInput),
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(true);
    if (result.valid)
      expect(result.data).toMatchInlineSnapshot(`
      {
        "address": "0x983bb18e768a1f736b6f0011a65833243fa7e3bf908b7f9535b1049d8307f328",
        "chainId": "aptos:mainnet",
        "domain": "example.com",
        "expirationTime": undefined,
        "issuedAt": undefined,
        "nonce": "abc123",
        "notBefore": undefined,
        "requestId": undefined,
        "resources": undefined,
        "statement": undefined,
        "uri": "https://example.com",
        "version": "1",
      }
    `);
  });

  test("fails when invalid string message", async () => {
    const result = await verifySignInMessage({
      expected: defaultFieldsInput,
      message: "Invalid message format",
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_message"]);
  });

  test.each([
    // Field, mismatched value, expected error
    ["domain", "different.com", "message_domain_mismatch"],
    ["address", "0x456", "message_address_mismatch"],
    ["statement", "Sign in to Example.com", "message_statement_mismatch"],
    ["uri", "https://different.com", "message_uri_mismatch"],
    ["version", "2", "message_version_mismatch"],
    ["chainId", "aptos:testnet", "message_chain_id_mismatch"],
    ["nonce", "def456", "message_nonce_mismatch"],
    ["issuedAt", "2023-01-01T00:00:00Z", "message_issued_at_mismatch"],
    [
      "expirationTime",
      "2023-01-01T00:00:00Z",
      "message_expiration_time_mismatch",
    ],
    ["notBefore", "2023-01-01T00:00:00Z", "message_not_before_mismatch"],
    ["requestId", "req456", "message_request_id_mismatch"],
  ])("fails when %s mismatch", async (field, value, expectedError) => {
    const result = await verifySignInMessage({
      expected: { ...defaultFieldsInput, [field]: value },
      message: createSignInMessageText(defaultFieldsInput),
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toEqual([expectedError]);
    }
  });

  test("fails when resources is missing", async () => {
    const result = await verifySignInMessage({
      expected: { ...defaultFieldsInput, resources: ["resource1"] },
      message: createSignInMessageText(defaultFieldsInput),
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_missing"]);
  });

  test("fails when resources mismatch", async () => {
    const result = await verifySignInMessage({
      expected: { ...extraFieldsInput, resources: ["resource1"] },
      message: createSignInMessageText(extraFieldsInput),
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_mismatch"]);
  });

  test("fails when resources is unexpected", async () => {
    const result = await verifySignInMessage({
      expected: { ...extraFieldsInput, resources: undefined },
      message: createSignInMessageText(extraFieldsInput),
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_unexpected"]);
  });

  test("fails when public key is invalid", async () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = await verifySignInMessage({
      expected: defaultFieldsInput,
      message,
      publicKey: {} as PublicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_public_key"]);
  });

  test("fails when public key's auth key does not match message address", async () => {
    const account = Ed25519Account.generate();
    const message = createSignInMessageText(defaultFieldsInput);
    const result = await verifySignInMessage({
      expected: defaultFieldsInput,
      message,
      publicKey: account.publicKey,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_auth_key"]);
  });

  test("verifies when resources are excluded", async () => {
    const result = await verifySignInMessage(
      {
        expected: { ...extraFieldsInput },
        message: createSignInMessageText({
          ...extraFieldsInput,
          resources: ["resource1", "resource2:placeholder"],
        }),
        publicKey: ed25519Account.publicKey,
      },
      {
        aptosConfig: new AptosConfig({ network: Network.MAINNET }),
        excludedResources: ["resource2"],
      },
    );
    expect(result.valid).toBe(true);
  });
});

describe("verifySignInSignature", () => {
  const publicKey = ed25519Account.publicKey;

  test("verifies valid signature and message", async () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = await verifySignInSignature({
      publicKey,
      signature: ed25519Account.sign(generateSignInSigningMessage(message)),
      message,
    });
    expect(result.valid).toBe(true);
    if (result.valid)
      expect(result.data).toMatchInlineSnapshot(`
      {
        "address": "0x983bb18e768a1f736b6f0011a65833243fa7e3bf908b7f9535b1049d8307f328",
        "chainId": "aptos:mainnet",
        "domain": "example.com",
        "expirationTime": undefined,
        "issuedAt": undefined,
        "nonce": "abc123",
        "notBefore": undefined,
        "requestId": undefined,
        "resources": undefined,
        "statement": undefined,
        "uri": "https://example.com",
        "version": "1",
      }
    `);
  });

  test("fails when signature is invalid", async () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = await verifySignInSignature({
      publicKey,
      signature: new Ed25519Signature(new Uint8Array(64)),
      message,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_signature"]);
  });

  test("fails when message verification fails", async () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = await verifySignInSignature({
      publicKey: publicKey,
      signature: ed25519Account.sign(message),
      message: "Invalid message format",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_message"]);
  });
});
