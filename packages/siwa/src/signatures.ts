import {
  type Aptos,
  Hex,
  type HexInput,
  type PublicKey,
  type Signature,
} from "@aptos-labs/ts-sdk";
import { mainnet } from "./internal.js";

/**
 * Helper function to convert a message to sign or to verify to a valid message input
 *
 * @param message a message as a string or Uint8Array
 *
 * @returns a valid HexInput - string or Uint8Array
 * @group Implementation
 * @category Serialization
 */
export const convertSigningMessage = (message: HexInput): HexInput => {
  // if message is of type string, verify it is a valid Hex string
  if (typeof message === "string") {
    const isValid = Hex.isValid(message);
    // If message is not a valid Hex string, convert it
    if (!isValid.valid) {
      return new TextEncoder().encode(message);
    }
    // If message is a valid Hex string, return it
    return message;
  }
  // message is a Uint8Array
  return message;
};

/**
 * Verifies a signature using the Sign in with Aptos signing algorithm.
 *
 * @param output The AptosSignInOutput to verify the signature against.
 * @param options The options to use for the verification.
 *
 * @returns The verification result.
 */
export async function verifySignature(
  params: {
    publicKey: PublicKey;
    signature: Signature;
    signingMessage: HexInput;
  },
  options: { aptos?: Aptos } = {},
): Promise<boolean> {
  return params.publicKey.verifySignatureAsync({
    aptosConfig: options.aptos?.config ?? mainnet.config,
    message: convertSigningMessage(params.signingMessage),
    signature: params.signature,
  });
}
