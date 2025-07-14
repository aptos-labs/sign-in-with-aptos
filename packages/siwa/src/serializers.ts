import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import type {
  AptosSignInBoundFields,
  AptosSignInInput,
  AptosSignInOutput,
} from "@aptos-labs/wallet-standard";
import {
  deserializeSignInPublicKey,
  deserializeSignInSignature,
  isValidPublicKeyScheme,
} from "./utils.js";

export const CURRENT_SERIALIZATION_VERSION = "2";

export type SerializationVersion = "2";

export type SerializedAptosSignInOutput = {
  version: "2";
  type: string;
  signature: string;
  input: AptosSignInInput & AptosSignInBoundFields;
  publicKey: string;
};

export type DeserializedAptosSignInOutput = {
  version: "2";
  type: string;
  signature: Signature;
  input: AptosSignInInput & AptosSignInBoundFields;
  publicKey: PublicKey;
};

export const serializeSignInOutput = (
  output: Pick<AptosSignInOutput, "type" | "signature" | "input" | "account">,
): SerializedAptosSignInOutput => ({
  version: CURRENT_SERIALIZATION_VERSION,
  type: output.type,
  signature: output.signature.bcsToHex().toString(),
  input: output.input,
  publicKey: output.account.publicKey.bcsToHex().toString(),
});

export const deserializeSignInOutput = (
  serialized: SerializedAptosSignInOutput,
): DeserializedAptosSignInOutput => {
  const { version } = serialized;

  if (version === "2") {
    if (!isValidPublicKeyScheme(serialized.type)) {
      throw new Error(`Unexpected public key scheme: ${serialized.type}`);
    }

    return {
      version: "2",
      type: serialized.type,
      signature: deserializeSignInSignature(
        serialized.type,
        serialized.signature,
      ),
      input: serialized.input,
      publicKey: deserializeSignInPublicKey(
        serialized.type,
        serialized.publicKey,
      ),
    };
  }

  throw new Error(`Unexpected serialization version: ${version}`);
};
