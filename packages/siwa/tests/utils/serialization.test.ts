import {
  AnyPublicKey,
  AnySignature,
  Ed25519PublicKey,
  Ed25519Signature,
  MultiEd25519PublicKey,
  MultiEd25519Signature,
  MultiKey,
  MultiKeySignature,
  SigningScheme,
} from "@aptos-labs/ts-sdk";
import { describe } from "node:test";
import {
  deserializeSignInPublicKey,
  deserializeSignInSignature,
  generateNonce,
} from "../../src/utils.js";
import { expect, test } from "vitest";

describe("deserializeSignInPublicKey", () => {
  test("should deserialize a Ed25519PublicKey using string", () => {
    const publicKey = new Ed25519PublicKey(new Uint8Array(32));
    expect(
      deserializeSignInPublicKey("ed25519", publicKey.bcsToBytes())
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a MultiEd25519PublicKey using string", () => {
    const publicKey = new MultiEd25519PublicKey({
      publicKeys: [
        new Ed25519PublicKey(new Uint8Array(32)),
        new Ed25519PublicKey(new Uint8Array(32)),
      ],
      threshold: 1,
    });
    expect(
      deserializeSignInPublicKey("multi_ed25519", publicKey.bcsToBytes())
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a SingleKey using string", () => {
    const publicKey = new AnyPublicKey(
      new Ed25519PublicKey(new Uint8Array(32))
    );
    expect(
      deserializeSignInPublicKey("single_key", publicKey.bcsToBytes())
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a MultiKey using string", () => {
    const publicKey = new MultiKey({
      publicKeys: [
        new Ed25519PublicKey(new Uint8Array(32)),
        new Ed25519PublicKey(new Uint8Array(32)),
      ],
      signaturesRequired: 1,
    });
    expect(
      deserializeSignInPublicKey("multi_key", publicKey.bcsToBytes())
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a Ed25519PublicKey using SigningScheme", () => {
    const publicKey = new Ed25519PublicKey(new Uint8Array(32));
    expect(
      deserializeSignInPublicKey(SigningScheme.Ed25519, publicKey.bcsToBytes())
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a MultiEd25519PublicKey using SigningScheme", () => {
    const publicKey = new MultiEd25519PublicKey({
      publicKeys: [
        new Ed25519PublicKey(new Uint8Array(32)),
        new Ed25519PublicKey(new Uint8Array(32)),
      ],
      threshold: 1,
    });
    expect(
      deserializeSignInPublicKey(
        SigningScheme.MultiEd25519,
        publicKey.bcsToBytes()
      )
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a SingleKey using SigningScheme", () => {
    const publicKey = new AnyPublicKey(
      new Ed25519PublicKey(new Uint8Array(32))
    );
    expect(
      deserializeSignInPublicKey(
        SigningScheme.SingleKey,
        publicKey.bcsToBytes()
      )
    ).toStrictEqual(publicKey);
  });

  test("should deserialize a MultiKey using SigningScheme", () => {
    const publicKey = new MultiKey({
      publicKeys: [
        new Ed25519PublicKey(new Uint8Array(32)),
        new Ed25519PublicKey(new Uint8Array(32)),
      ],
      signaturesRequired: 1,
    });
    expect(
      deserializeSignInPublicKey(SigningScheme.MultiKey, publicKey.bcsToBytes())
    ).toStrictEqual(publicKey);
  });

  test("throw error if the public key scheme string is not valid", () => {
    expect(() =>
      deserializeSignInPublicKey("invalid" as "ed25519", new Uint8Array(64))
    ).toThrow();
    expect(() =>
      deserializeSignInPublicKey(100 as SigningScheme, new Uint8Array(64))
    ).toThrow();
  });
});

describe("serializeSignInPublicKey", () => {
  test("should serialize a Ed25519PublicKey using string", () => {
    const signature = new Ed25519Signature(new Uint8Array(64));
    expect(
      deserializeSignInSignature("ed25519", signature.bcsToBytes())
    ).toStrictEqual(signature);
  });

  test("should serialize a MultiEd25519Signature using string", () => {
    const signature = new MultiEd25519Signature({
      signatures: [new Ed25519Signature(new Uint8Array(64))],
      bitmap: [0],
    });
    expect(
      deserializeSignInSignature("multi_ed25519", signature.bcsToBytes())
    ).toStrictEqual(signature);
  });

  test("should serialize a SingleKey using string", () => {
    const signature = new AnySignature(
      new Ed25519Signature(new Uint8Array(64))
    );
    expect(
      deserializeSignInSignature("single_key", signature.bcsToBytes())
    ).toStrictEqual(signature);
  });

  test("should serialize a MultiKey using string", () => {
    const signature = new MultiKeySignature({
      signatures: [new Ed25519Signature(new Uint8Array(64))],
      bitmap: [0],
    });
    expect(
      deserializeSignInSignature("multi_key", signature.bcsToBytes())
    ).toStrictEqual(signature);
  });

  test("should serialize a Ed25519Signature using SigningScheme", () => {
    const signature = new Ed25519Signature(new Uint8Array(64));
    expect(
      deserializeSignInSignature(SigningScheme.Ed25519, signature.bcsToBytes())
    ).toStrictEqual(signature);
  });

  test("should serialize a MultiEd25519Signature using SigningScheme", () => {
    const signature = new MultiEd25519Signature({
      signatures: [new Ed25519Signature(new Uint8Array(64))],
      bitmap: [0],
    });
    expect(
      deserializeSignInSignature(
        SigningScheme.MultiEd25519,
        signature.bcsToBytes()
      )
    ).toStrictEqual(signature);
  });

  test("should serialize a SingleKey using SigningScheme", () => {
    const signature = new AnySignature(
      new Ed25519Signature(new Uint8Array(64))
    );
    expect(
      deserializeSignInSignature(
        SigningScheme.SingleKey,
        signature.bcsToBytes()
      )
    ).toStrictEqual(signature);
  });

  test("should serialize a MultiKey using SigningScheme", () => {
    const signature = new MultiKeySignature({
      signatures: [new Ed25519Signature(new Uint8Array(64))],
      bitmap: [0],
    });
    expect(
      deserializeSignInSignature(SigningScheme.MultiKey, signature.bcsToBytes())
    ).toStrictEqual(signature);
  });

  test("throw error if the signature scheme string is not valid", () => {
    expect(() =>
      deserializeSignInSignature("invalid" as "ed25519", new Uint8Array(64))
    ).toThrow();
    expect(() =>
      deserializeSignInSignature(100 as SigningScheme, new Uint8Array(64))
    ).toThrow();
  });
});

describe("generateNonce", () => {
  test("should generate a random nonce", () => {
    const found = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const nonce = generateNonce();
      expect(found.has(nonce)).toBe(false);
      found.add(nonce);
    }
  });
});
