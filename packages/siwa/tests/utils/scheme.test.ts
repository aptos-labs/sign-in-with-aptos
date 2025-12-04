/** biome-ignore-all lint/suspicious/noExplicitAny: Allowed */

import { EIP1193DerivedPublicKey } from "@aptos-labs/derived-wallet-ethereum";
import { SolanaDerivedPublicKey } from "@aptos-labs/derived-wallet-solana";
import {
  AnyPublicKey,
  Ed25519PublicKey,
  MultiEd25519PublicKey,
  MultiKey,
  SigningScheme,
} from "@aptos-labs/ts-sdk";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { describe, expect, test } from "vitest";
import {
  getSignInPublicKeyScheme,
  isValidPublicKeyScheme,
} from "../../src/utils.js";

describe("isValidPublicKeyScheme", () => {
  test("should return true for valid schemes", () => {
    expect(isValidPublicKeyScheme("ed25519")).toBe(true);
    expect(isValidPublicKeyScheme("multi_ed25519")).toBe(true);
    expect(isValidPublicKeyScheme("single_key")).toBe(true);
    expect(isValidPublicKeyScheme("multi_key")).toBe(true);
    expect(isValidPublicKeyScheme("solana_derived")).toBe(true);
    expect(isValidPublicKeyScheme("ethereum_derived")).toBe(true);
  });

  test("should return false for invalid schemes", () => {
    expect(isValidPublicKeyScheme("invalid")).toBe(false);
    expect(isValidPublicKeyScheme("")).toBe(false);
    expect(isValidPublicKeyScheme("ED25519")).toBe(false);
  });
});

describe("getSignInPublicKeyScheme", () => {
  test("should return the correct scheme for Ed25519PublicKey", async () => {
    expect(
      await getSignInPublicKeyScheme(new Ed25519PublicKey(new Uint8Array(32))),
    ).toBe("ed25519");
    expect(await getSignInPublicKeyScheme(SigningScheme.Ed25519)).toBe(
      "ed25519",
    );
  });

  test("should return the correct scheme for MultiEd25519PublicKey", async () => {
    expect(
      await getSignInPublicKeyScheme(
        new MultiEd25519PublicKey({
          publicKeys: [
            new Ed25519PublicKey(new Uint8Array(32)),
            new Ed25519PublicKey(new Uint8Array(32)),
          ],
          threshold: 1,
        }),
      ),
    ).toBe("multi_ed25519");
    expect(await getSignInPublicKeyScheme(SigningScheme.MultiEd25519)).toBe(
      "multi_ed25519",
    );
  });

  test("should return the correct scheme for SingleKey", async () => {
    expect(
      await getSignInPublicKeyScheme(
        new AnyPublicKey(new Ed25519PublicKey(new Uint8Array(32))),
      ),
    ).toBe("single_key");
    expect(await getSignInPublicKeyScheme(SigningScheme.SingleKey)).toBe(
      "single_key",
    );
  });

  test("should return the correct scheme for MultiKey", async () => {
    expect(
      await getSignInPublicKeyScheme(
        new MultiKey({
          publicKeys: [
            new Ed25519PublicKey(new Uint8Array(32)),
            new Ed25519PublicKey(new Uint8Array(32)),
          ],
          signaturesRequired: 1,
        }),
      ),
    ).toBe("multi_key");
    expect(await getSignInPublicKeyScheme(SigningScheme.MultiKey)).toBe(
      "multi_key",
    );
  });

  test("should return the correct scheme for SolanaDerivedPublicKey", async () => {
    const publicKey = new SolanaDerivedPublicKey({
      domain: "example.com",
      solanaPublicKey: new SolanaPublicKey(new Uint8Array(32)),
      authenticationFunction: "0x1::solana_derivable_account::authenticate",
    });
    expect(await getSignInPublicKeyScheme(publicKey)).toBe("solana_derived");
  });

  test("should return the correct scheme for EIP1193DerivedPublicKey", async () => {
    const publicKey = new EIP1193DerivedPublicKey({
      domain: "example.com",
      ethereumAddress: "0x1234567890123456789012345678901234567890",
      authenticationFunction: "0x1::ethereum_derivable_account::authenticate",
    });
    expect(await getSignInPublicKeyScheme(publicKey)).toBe("ethereum_derived");
  });

  test("should throw an error for an unknown scheme", async () => {
    await expect(getSignInPublicKeyScheme(100 as any)).rejects.toThrow(
      "Unknown public key type for signing scheme: 100",
    );
  });

  test("should throw an error for an unknown instance", async () => {
    await expect(getSignInPublicKeyScheme({} as any)).rejects.toThrow(
      "Unknown public key type for instance: [object Object]",
    );
  });
});
