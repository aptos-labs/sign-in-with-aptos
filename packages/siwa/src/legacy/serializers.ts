import type {
  AptosSignInInput,
  AptosSignInOutput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";
import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import {
  deserializeSignInSignature,
  deserializeSignInPublicKey,
  isValidPublicKeyScheme,
} from "../utils.js";

export const CURRENT_LEGACY_SERIALIZATION_VERSION = "1";

export type LegacySerializationVersion = "1";

export type SerializedLegacyAptosSignInOutput = {
  version: "1";
  type: string;
  signature: string;
  message: string;
  publicKey: string;
};

export type DeserializedLegacyAptosSignInOutput = {
  version: "1";
  type: string;
  signature: Signature;
  message: string;
  publicKey: PublicKey;
};

export const serializeLegacySignInOutput = (
  output: Pick<AptosSignInOutput, "type" | "signature" | "account"> & {
    message: string;
  },
): SerializedLegacyAptosSignInOutput => ({
  version: CURRENT_LEGACY_SERIALIZATION_VERSION,
  type: output.type,
  signature: output.signature.bcsToHex().toString(),
  message: output.message,
  publicKey: output.account.publicKey.bcsToHex().toString(),
});

export const deserializeLegacySignInOutput = (
  serialized: SerializedLegacyAptosSignInOutput,
): DeserializedLegacyAptosSignInOutput => {
  const { version } = serialized;

  if (version === "1") {
    if (!isValidPublicKeyScheme(serialized.type)) {
      throw new Error(`Unexpected public key scheme: ${serialized.type}`);
    }

    return {
      version: "1",
      type: serialized.type,
      signature: deserializeSignInSignature(
        serialized.type,
        serialized.signature,
      ),
      publicKey: deserializeSignInPublicKey(
        serialized.type,
        serialized.publicKey,
      ),
      message: serialized.message,
    };
  }

  throw new Error(`Unexpected serialization version: ${version}`);
};
