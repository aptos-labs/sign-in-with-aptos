import {
  AccountAddress,
  AccountPublicKey,
  type Aptos,
  Hex,
  type PublicKey,
  type Signature,
} from "@aptos-labs/ts-sdk";
import type {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";
import { sha3_256 } from "@noble/hashes/sha3";
import { createSignInMessage } from "../core.js";
import type { VerificationError } from "../types.js";
import { verifySignature } from "../signatures.js";
import { mainnet } from "../internal.js";

export type VerificationFullMessageError = "invalid_full_message";

type LegacyVerificationError = VerificationError | VerificationFullMessageError;

export type LegacyVerificationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: LegacyVerificationError[] };

export const createLegacySignInMessage = (
  input: AptosSignInInput & AptosSignInRequiredFields,
) => {
  let message = createSignInMessage(input);
  message += `\n\nHash: ${Hex.fromHexInput(sha3_256(message)).toString()}`;
  return message;
};

export const verifyLegacySignIn = async (
  input: AptosSignInInput & AptosSignInRequiredFields,
  output: {
    publicKey: PublicKey;
    signature: Signature;
    message: string;
  },
  options: { aptos?: Aptos } = {},
): Promise<
  LegacyVerificationResult<AptosSignInInput & AptosSignInRequiredFields>
> => {
  const embeddedMessage = createLegacySignInMessage(input);

  if (!output.message.includes(embeddedMessage)) {
    return { valid: false, errors: ["invalid_full_message"] };
  }

  if (!(output.publicKey instanceof AccountPublicKey)) {
    return { valid: false, errors: ["invalid_public_key"] };
  }

  const authKey = output.publicKey.authKey().derivedAddress();

  const originalAddress = await (
    options.aptos ?? mainnet
  ).lookupOriginalAccountAddress({ authenticationKey: authKey });

  if (
    !AccountAddress.from(input.address, {
      maxMissingChars: 63,
    }).equals(originalAddress)
  ) {
    return { valid: false, errors: ["invalid_auth_key"] };
  }

  const isSignatureValid = await verifySignature(
    {
      publicKey: output.publicKey,
      signature: output.signature,
      signingMessage: output.message,
    },
    { aptos: options.aptos },
  );

  if (!isSignatureValid) return { valid: false, errors: ["invalid_signature"] };

  return { valid: true, data: input };
};
