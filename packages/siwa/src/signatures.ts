import type { Aptos, HexInput, PublicKey, Signature } from "@aptos-labs/ts-sdk";
import { mainnet } from "./internal.js";

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
    message: params.signingMessage,
    signature: params.signature,
  });
}
