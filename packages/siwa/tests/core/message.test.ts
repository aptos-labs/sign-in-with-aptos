import { describe, expect, test } from "vitest";
import { createSignInMessage, parseSignInMessage } from "../../src/core.js";
import type { AptosSignInInput } from "@aptos-labs/wallet-standard";
import type { AptosSignInBoundFields } from "@aptos-labs/wallet-standard";

const defaultFieldsInput = {
  domain: "example.com",
  uri: "https://example.com",
  address: "0x0000000000000000000000000000000000000000000000000000000000000001",
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123",
} satisfies AptosSignInInput & AptosSignInBoundFields;

const extraFieldsInput = {
  ...defaultFieldsInput,
  statement: "Sign in to Example.com",
  nonce: "abc123",
  issuedAt: "2023-01-01T00:00:00Z",
  expirationTime: "2024-01-01T00:00:00Z",
  notBefore: "2023-01-01T00:00:00Z",
  requestId: "req123",
  resources: ["resource1", "resource2"],
} satisfies AptosSignInInput & AptosSignInBoundFields;

describe("createSignInMessage", () => {
  test("creates basic message with required fields", () => {
    const message = createSignInMessage(defaultFieldsInput);
    expect(message).toMatchInlineSnapshot(`
      "example.com wants you to sign in with your Aptos account:
      0x0000000000000000000000000000000000000000000000000000000000000001

      URI: https://example.com
      Version: 1
      Nonce: abc123
      Chain ID: aptos:mainnet"
    `);
  });

  test("creates message with all fields", () => {
    const message = createSignInMessage(extraFieldsInput);
    expect(message).toMatchInlineSnapshot(`
      "example.com wants you to sign in with your Aptos account:
      0x0000000000000000000000000000000000000000000000000000000000000001

      Sign in to Example.com

      URI: https://example.com
      Version: 1
      Nonce: abc123
      Issued At: 2023-01-01T00:00:00Z
      Expiration Time: 2024-01-01T00:00:00Z
      Not Before: 2023-01-01T00:00:00Z
      Request ID: req123
      Chain ID: aptos:mainnet
      Resources:
      - resource1
      - resource2"
    `);
  });
});

describe("parseSignInMessage", () => {
  test("successfully parses small message", () => {
    const message = createSignInMessage(defaultFieldsInput);
    const result = parseSignInMessage(message);
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "address": "0x0000000000000000000000000000000000000000000000000000000000000001",
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
        },
        "valid": true,
      }
    `);
  });

  test("successfully parses large message", () => {
    const message = createSignInMessage(extraFieldsInput);
    const result = parseSignInMessage(message);
    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "address": "0x0000000000000000000000000000000000000000000000000000000000000001",
          "chainId": "aptos:mainnet",
          "domain": "example.com",
          "expirationTime": "2024-01-01T00:00:00Z",
          "issuedAt": "2023-01-01T00:00:00Z",
          "nonce": "abc123",
          "notBefore": "2023-01-01T00:00:00Z",
          "requestId": "req123",
          "resources": [
            "resource1",
            "resource2",
          ],
          "statement": "Sign in to Example.com",
          "uri": "https://example.com",
          "version": "1",
        },
        "valid": true,
      }
    `);
  });

  test("fails invalid message format", () => {
    const message = "Invalid message format";
    const result = parseSignInMessage(message);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toEqual(["invalid_message"]);
    expect(result).toMatchInlineSnapshot(`
      {
        "errors": [
          "invalid_message",
        ],
        "valid": false,
      }
    `);
  });

  test("fails when domain is missing", () => {
    const message = createSignInMessage({
      ...defaultFieldsInput,
      domain: undefined,
      // biome-ignore lint/suspicious/noExplicitAny: Explicitly breaking type safety
    } as any);
    const result = parseSignInMessage(message);
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_domain_missing"]);
  });

  test("fails when address is missing", () => {
    const message = createSignInMessage({
      ...defaultFieldsInput,
      address: undefined,
      // biome-ignore lint/suspicious/noExplicitAny: Explicitly breaking type safety
    } as any);
    const result = parseSignInMessage(message);
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_address_missing"]);
  });

  test("fails when version is missing", () => {
    const message = createSignInMessage({
      ...defaultFieldsInput,
      version: undefined,
      // biome-ignore lint/suspicious/noExplicitAny: Explicitly breaking type safety
    } as any);
    const result = parseSignInMessage(message);
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_version_missing"]);
  });

  test("fails when chainId is missing", () => {
    const message = createSignInMessage({
      ...defaultFieldsInput,
      chainId: undefined,
      // biome-ignore lint/suspicious/noExplicitAny: Explicitly breaking type safety
    } as any);
    const result = parseSignInMessage(message);
    expect(result.valid).toBe(false);
    if (!result.valid)
      expect(result.errors).toEqual(["message_chain_id_missing"]);
  });
});
