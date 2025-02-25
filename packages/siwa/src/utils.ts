import {
  type PublicKey,
  SigningScheme,
  Ed25519PublicKey,
  MultiEd25519PublicKey,
  AnyPublicKey,
  MultiKey,
  type HexInput,
  Hex,
  Deserializer,
  Ed25519Signature,
  MultiEd25519Signature,
  AnySignature,
  type Signature,
  MultiKeySignature,
} from "@aptos-labs/ts-sdk";
import { encodeBase64 } from "./internal.js";

/**
 * Check if the scheme is a valid public key scheme
 *
 * @param scheme The scheme to check.
 *
 * @returns True if the scheme is a valid public key scheme, false otherwise.
 */
export const isValidPublicKeyScheme = (
  scheme: string,
): scheme is "ed25519" | "multi_ed25519" | "single_key" | "multi_key" => {
  return (
    scheme === "ed25519" ||
    scheme === "multi_ed25519" ||
    scheme === "single_key" ||
    scheme === "multi_key"
  );
};

/**
 * Get the signing scheme of a public key.
 *
 * @param value The public key or signing scheme to get the scheme of.
 *
 * @returns The signing scheme of the public key.
 */
export function getSignInPublicKeyScheme(
  value: SigningScheme | PublicKey,
): string {
  // If the value is a PublicKey
  if (typeof value === "object") {
    if (Ed25519PublicKey.isInstance(value)) {
      return "ed25519";
    }
    if (AnyPublicKey.isInstance(value)) {
      return "single_key";
    }
    if (MultiKey.isInstance(value)) {
      return "multi_key";
    }
    if (value instanceof MultiEd25519PublicKey) {
      return "multi_ed25519";
    }
    throw new Error(`Unknown public key type for instance: ${value}`);
  }

  // If the value is a SigningScheme
  switch (value) {
    case SigningScheme.Ed25519:
      return "ed25519";
    case SigningScheme.MultiEd25519:
      return "multi_ed25519";
    case SigningScheme.SingleKey:
      return "single_key";
    case SigningScheme.MultiKey:
      return "multi_key";
    default:
      throw new Error(`Unknown public key type for signing scheme: ${value}`);
  }
}

/**
 * Deserialize a public key from a hex string.
 *
 * @param scheme The signing scheme of the public key.
 * @param value The hex string to deserialize.
 *
 * @returns The deserialized public key.
 */
export function deserializeSignInPublicKey(
  scheme:
    | SigningScheme
    | "ed25519"
    | "multi_ed25519"
    | "single_key"
    | "multi_key",
  value: HexInput,
): PublicKey {
  const deserializer = new Deserializer(Hex.fromHexInput(value).toUint8Array());

  if (typeof scheme !== "string") {
    switch (scheme) {
      case SigningScheme.Ed25519:
        return Ed25519PublicKey.deserialize(deserializer);
      case SigningScheme.MultiEd25519:
        return MultiEd25519PublicKey.deserialize(deserializer);
      case SigningScheme.SingleKey:
        return AnyPublicKey.deserialize(deserializer);
      case SigningScheme.MultiKey:
        return MultiKey.deserialize(deserializer);
      default:
        throw new Error(
          `Unknown public key type for signing scheme: ${scheme}`,
        );
    }
  }

  // If the type is a string
  switch (scheme) {
    case "ed25519":
      return Ed25519PublicKey.deserialize(deserializer);
    case "multi_ed25519":
      return MultiEd25519PublicKey.deserialize(deserializer);
    case "single_key":
      return AnyPublicKey.deserialize(deserializer);
    case "multi_key":
      return MultiKey.deserialize(deserializer);
    default:
      throw new Error(`Unknown public key type: ${scheme}`);
  }
}

export function deserializeSignInSignature(
  scheme:
    | SigningScheme
    | "ed25519"
    | "multi_ed25519"
    | "single_key"
    | "multi_key",
  value: HexInput,
): Signature {
  const deserializer = new Deserializer(Hex.fromHexInput(value).toUint8Array());

  if (typeof scheme !== "string") {
    switch (scheme) {
      case SigningScheme.Ed25519:
        return Ed25519Signature.deserialize(deserializer);
      case SigningScheme.MultiEd25519:
        return MultiEd25519Signature.deserialize(deserializer);
      case SigningScheme.SingleKey:
        return AnySignature.deserialize(deserializer);
      case SigningScheme.MultiKey:
        return MultiKeySignature.deserialize(deserializer);
      default:
        throw new Error(`Unknown signature type for signing scheme: ${scheme}`);
    }
  }
  // If the type is a string
  switch (scheme) {
    case "ed25519":
      return Ed25519Signature.deserialize(deserializer);
    case "multi_ed25519":
      return MultiEd25519Signature.deserialize(deserializer);
    case "single_key":
      return AnySignature.deserialize(deserializer);
    case "multi_key":
      return MultiKeySignature.deserialize(deserializer);
    default:
      throw new Error(`Unknown signature type: ${scheme}`);
  }
}

export function generateNonce(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return encodeBase64(bytes);
}
