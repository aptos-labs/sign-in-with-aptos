import { describe, expect, test } from "vitest";
import {
  createSignInMessageText,
  verifySignInMessage,
  verifySignIn,
  generateSignInSigningMessage,
} from "../../src/core.js";
import { Ed25519Signature } from "@aptos-labs/ts-sdk";
import { ed25519Account } from "../lib/constants.js";
import {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";

const defaultFieldsInput = {
  domain: "example.com",
  uri: "https://example.com",
  address: "0x123",
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
  test("verifies matching input and string message", () => {
    const result = verifySignInMessage(
      defaultFieldsInput,
      createSignInMessageText(defaultFieldsInput)
    );
    expect(result.valid).toBe(true);
    if (result.valid)
      expect(result.data).toMatchInlineSnapshot(`
      {
        "address": "0x123",
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

  test("fails when invalid string message", () => {
    const result = verifySignInMessage(
      defaultFieldsInput,
      "Invalid message format"
    );
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
  ])("fails when %s mismatch", (field, value, expectedError) => {
    const result = verifySignInMessage(
      { ...defaultFieldsInput, [field]: value },
      createSignInMessageText(defaultFieldsInput)
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toEqual([expectedError]);
    }
  });

  test("fails when resources is missing", () => {
    const result = verifySignInMessage(
      { ...defaultFieldsInput, resources: ["resource1"] },
      createSignInMessageText(defaultFieldsInput)
    );
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_missing"]);
  });

  test("fails when resources mismatch", () => {
    const result = verifySignInMessage(
      { ...extraFieldsInput, resources: ["resource1"] },
      createSignInMessageText(extraFieldsInput)
    );
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_mismatch"]);
  });

  test("fails when resources is unexpected", () => {
    const result = verifySignInMessage(
      { ...extraFieldsInput, resources: undefined },
      createSignInMessageText(extraFieldsInput)
    );
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_unexpected"]);
  });

  test("verifies when resources are excluded", () => {
    const result = verifySignInMessage(
      { ...extraFieldsInput },
      createSignInMessageText({
        ...extraFieldsInput,
        resources: ["resource1", "resource2:placeholder"],
      }),
      { excludedResources: ["resource2"] }
    );
    expect(result.valid).toBe(true);
  });
});

describe("verifySignIn", () => {
  const publicKey = ed25519Account.publicKey;

  test("verifies valid signature and message", () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = verifySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(generateSignInSigningMessage(message)),
      message,
    });
    expect(result.valid).toBe(true);
    if (result.valid)
      expect(result.data).toMatchInlineSnapshot(`
      {
        "address": "0x123",
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

  test("fails when signature is invalid", () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = verifySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: new Ed25519Signature(new Uint8Array(64)),
      message,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_signature"]);
  });

  test("fails when message verification fails", () => {
    const message = createSignInMessageText(defaultFieldsInput);
    const result = verifySignIn(defaultFieldsInput, {
      publicKey: publicKey,
      signature: ed25519Account.sign(message),
      message: "Invalid message format",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_message"]);
  });
});
