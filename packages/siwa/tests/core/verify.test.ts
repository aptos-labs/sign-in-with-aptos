import {
  Ed25519Account,
  Ed25519Signature,
  type PublicKey,
} from "@aptos-labs/ts-sdk";
import type {
  AptosSignInBoundFields,
  AptosSignInInput,
} from "@aptos-labs/wallet-standard";
import { describe, expect, test } from "vitest";
import {
  createSignInMessage,
  createSignInSigningMessage,
  verifySignInMessage,
  verifySignInSignature,
} from "../../src/core.js";
import { testMainnet } from "../lib/clients.js";
import { ed25519Account } from "../lib/constants.js";

const defaultFieldsInput = {
  domain: "example.com",
  uri: "https://example.com",
  address: ed25519Account.accountAddress.toString(),
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123",
} satisfies AptosSignInInput & AptosSignInBoundFields;

const extraFieldsInput = {
  ...defaultFieldsInput,
  statement: "Sign in to Example.com",
  nonce: "abc123",
  issuedAt: "2023-01-01T00:00:00Z",
  expirationTime: "2099-01-01T00:00:00Z",
  notBefore: "2023-01-01T00:00:00Z",
  requestId: "req123",
  resources: ["resource1", "resource2"],
} satisfies AptosSignInInput & AptosSignInBoundFields;

describe("verifySignInMessage", () => {
  test("verifies matching input and string message", async () => {
    const result = await verifySignInMessage({
      expected: defaultFieldsInput,
      input: defaultFieldsInput,
      publicKey: ed25519Account.publicKey,
    });
    expect(result.valid).toBe(true);
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
      "2050-01-01T00:00:00Z",
      "message_expiration_time_mismatch",
    ],
    ["notBefore", "2023-01-01T00:00:00Z", "message_not_before_mismatch"],
    ["requestId", "req456", "message_request_id_mismatch"],
  ])("fails when %s mismatch", async (field, value, expectedError) => {
    const result = await verifySignInMessage(
      {
        expected: { ...defaultFieldsInput, [field]: value },
        input: defaultFieldsInput,
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toEqual([expectedError]);
    }
  });

  test("fails when resources is missing", async () => {
    const result = await verifySignInMessage(
      {
        expected: { ...defaultFieldsInput, resources: ["resource1"] },
        input: defaultFieldsInput,
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_missing"]);
  });

  test("fails when resources mismatch", async () => {
    const result = await verifySignInMessage(
      {
        expected: { ...extraFieldsInput, resources: ["resource1"] },
        input: extraFieldsInput,
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_mismatch"]);
  });

  test("fails when resources is unexpected", async () => {
    const result = await verifySignInMessage(
      {
        expected: { ...extraFieldsInput, resources: undefined },
        input: extraFieldsInput,
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_resources_unexpected"]);
  });

  test("fails when public key is invalid", async () => {
    const result = await verifySignInMessage(
      {
        expected: defaultFieldsInput,
        input: defaultFieldsInput,
        publicKey: {} as PublicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_public_key"]);
  });

  test("fails when public key's auth key does not match message address", async () => {
    const account = Ed25519Account.generate();
    const result = await verifySignInMessage(
      {
        expected: defaultFieldsInput,
        input: defaultFieldsInput,
        publicKey: account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_auth_key"]);
  });

  test("fails when message is expired", async () => {
    const result = await verifySignInMessage(
      {
        expected: {
          ...defaultFieldsInput,
          expirationTime: "2023-01-01T00:00:00Z",
        },
        input: {
          ...defaultFieldsInput,
          expirationTime: "2023-01-01T00:00:00Z",
        },
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["message_expired"]);
  });

  test("fails when message is not valid yet", async () => {
    const result = await verifySignInMessage(
      {
        expected: {
          ...defaultFieldsInput,
          notBefore: "2030-01-01T00:00:00Z",
        },
        input: {
          ...defaultFieldsInput,
          notBefore: "2030-01-01T00:00:00Z",
        },
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["message_not_yet_valid"]);
  });

  test("verifies when resources are excluded", async () => {
    const result = await verifySignInMessage(
      {
        expected: { ...extraFieldsInput },
        input: {
          ...extraFieldsInput,
          resources: ["resource1", "resource2:placeholder"],
        },
        publicKey: ed25519Account.publicKey,
      },
      { aptos: testMainnet, excludedResources: ["resource2"] },
    );
    expect(result.valid).toBe(true);
  });
});

describe("verifySignInSignature", () => {
  const publicKey = ed25519Account.publicKey;

  test("verifies valid signature and message", async () => {
    const message = createSignInMessage(defaultFieldsInput);
    const result = await verifySignInSignature({
      publicKey,
      signature: ed25519Account.sign(createSignInSigningMessage(message)),
      input: defaultFieldsInput,
    });
    expect(result.valid).toBe(true);
  });

  test("fails when signature is invalid", async () => {
    const result = await verifySignInSignature({
      publicKey,
      signature: new Ed25519Signature(new Uint8Array(64)),
      input: defaultFieldsInput,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_signature"]);
  });

  test("uses correct client when provided", async () => {
    const message = createSignInMessage(defaultFieldsInput);
    const result = await verifySignInSignature(
      {
        publicKey,
        signature: ed25519Account.sign(createSignInSigningMessage(message)),
        input: defaultFieldsInput,
      },
      { aptos: testMainnet },
    );
    expect(result.valid).toBe(true);
  });
});
