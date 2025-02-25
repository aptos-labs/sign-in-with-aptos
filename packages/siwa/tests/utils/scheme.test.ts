import { describe, expect, test } from "vitest";
import { getSignInPublicKeyScheme } from "../../src/utils.js";
import {
  AnyPublicKey,
  Ed25519PublicKey,
  MultiEd25519PublicKey,
  MultiKey,
  SigningScheme,
} from "@aptos-labs/ts-sdk";

describe("getSignInPublicKeyScheme", () => {
  test("should return the correct scheme for Ed25519PublicKey", () => {
    expect(
      getSignInPublicKeyScheme(new Ed25519PublicKey(new Uint8Array(32))),
    ).toBe("ed25519");
    expect(getSignInPublicKeyScheme(SigningScheme.Ed25519)).toBe("ed25519");
  });

  test("should return the correct scheme for MultiEd25519PublicKey", () => {
    expect(
      getSignInPublicKeyScheme(
        new MultiEd25519PublicKey({
          publicKeys: [
            new Ed25519PublicKey(new Uint8Array(32)),
            new Ed25519PublicKey(new Uint8Array(32)),
          ],
          threshold: 1,
        }),
      ),
    ).toBe("multi_ed25519");
    expect(getSignInPublicKeyScheme(SigningScheme.MultiEd25519)).toBe(
      "multi_ed25519",
    );
  });

  test("should return the correct scheme for SingleKey", () => {
    expect(
      getSignInPublicKeyScheme(
        new AnyPublicKey(new Ed25519PublicKey(new Uint8Array(32))),
      ),
    ).toBe("single_key");
    expect(getSignInPublicKeyScheme(SigningScheme.SingleKey)).toBe(
      "single_key",
    );
  });

  test("should return the correct scheme for MultiKey", () => {
    expect(
      getSignInPublicKeyScheme(
        new MultiKey({
          publicKeys: [
            new Ed25519PublicKey(new Uint8Array(32)),
            new Ed25519PublicKey(new Uint8Array(32)),
          ],
          signaturesRequired: 1,
        }),
      ),
    ).toBe("multi_key");
    expect(getSignInPublicKeyScheme(SigningScheme.MultiKey)).toBe("multi_key");
  });

  test("should throw an error for an unknown scheme", () => {
    expect(() => getSignInPublicKeyScheme(100 as any)).toThrow(
      "Unknown public key type for signing scheme: 100",
    );
  });

  test("should throw an error for an unknown instance", () => {
    expect(() => getSignInPublicKeyScheme({} as any)).toThrow(
      "Unknown public key type for instance: [object Object]",
    );
  });
});
