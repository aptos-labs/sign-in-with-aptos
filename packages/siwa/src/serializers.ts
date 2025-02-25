import type { AptosSignInOutput } from "@aptos-labs/wallet-standard";
import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import {
  deserializeSignInSignature,
  deserializeSignInPublicKey,
  isValidPublicKeyScheme,
} from "./utils.js";

export const SERIALIZATION_VERSION = "1";

export type SerializedAptosSignInOutput = {
  version: typeof SERIALIZATION_VERSION;
  type: string;
  signature: string;
  message: string;
  publicKey: string;
};

export type DeserializedAptosSignInOutput = {
  type: string;
  signature: Signature;
  message: string;
  publicKey: PublicKey;
};

export const serializeSignInOutput = (
  output: Pick<
    AptosSignInOutput,
    "type" | "signature" | "plainText" | "account"
  >,
): SerializedAptosSignInOutput => ({
  version: SERIALIZATION_VERSION,
  type: output.type,
  signature: output.signature.bcsToHex().toString(),
  message: output.plainText,
  publicKey: output.account.publicKey.bcsToHex().toString(),
});

export const deserializeSignInOutput = (
  serialized: SerializedAptosSignInOutput,
): DeserializedAptosSignInOutput => {
  const { version } = serialized;

  if (version === SERIALIZATION_VERSION) {
    if (!isValidPublicKeyScheme(serialized.type)) {
      throw new Error(`Unexpected public key scheme: ${serialized.type}`);
    }

    return {
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
