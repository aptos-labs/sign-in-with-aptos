import { Hex, type PublicKey, type Signature } from "@aptos-labs/ts-sdk";
import type {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";
import { sha3_256 } from "@noble/hashes/sha3";
import { createSignInMessageText } from "./core.js";
import type { VerificationError } from "./types.js";

export type VerificationFullMessageError = "invalid_full_message";

type LegacyVerificationError = VerificationError | VerificationFullMessageError;

export type LegacyVerificationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: LegacyVerificationError[] };

export const createLegacySignInMessage = (
  input: AptosSignInInput & AptosSignInRequiredFields,
) => {
  let message = createSignInMessageText(input);
  message += `\n\nHash: ${Hex.fromHexInput(sha3_256(message)).toString()}`;
  return message;
};

export const verifyLegacySignIn = (
  input: AptosSignInInput & AptosSignInRequiredFields,
  output: { publicKey: PublicKey; signature: Signature; message: string },
): LegacyVerificationResult<AptosSignInInput & AptosSignInRequiredFields> => {
  const embeddedMessage = createLegacySignInMessage(input);

  if (!output.message.includes(embeddedMessage)) {
    return { valid: false, errors: ["invalid_full_message"] };
  }

  const isSignatureValid = output.publicKey.verifySignature(output);
  if (!isSignatureValid) return { valid: false, errors: ["invalid_signature"] };

  return { valid: true, data: input };
};
