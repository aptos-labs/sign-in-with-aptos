import {
  AnyPublicKey,
  AnyPublicKeyVariant,
  Hex,
  postAptosPepperService,
  type AptosConfig,
  type PublicKey,
  type Signature,
} from "@aptos-labs/ts-sdk";
import { generateSignInSigningMessage } from "./core.js";

/**
 * Verifies a signature using the Sign in with Aptos signing algorithm.
 *
 * @param output The AptosSignInOutput to verify the signature against.
 * @param options The options to use for the verification.
 *
 * @returns The verification result.
 */
export async function verifySignature(
  output: {
    publicKey: PublicKey;
    signature: Signature;
    message: string;
  },
  options: { aptosConfig: AptosConfig; isSigningMessage?: boolean },
): Promise<boolean> {
  const signingMessage = options.isSigningMessage
    ? output.message
    : generateSignInSigningMessage(output.message);

  // TODO: Remove this once the ts-sdk supports verifying Keyless signatures
  // if (AnyPublicKey.isInstance(output.publicKey)) {
  //   if (output.publicKey.variant === AnyPublicKeyVariant.Keyless) {
  //     try {
  //       const body = {
  //         public_key: output.publicKey.toStringWithoutPrefix(),
  //         signature: output.signature.toStringWithoutPrefix(),
  //         message: Hex.fromHexInput(signingMessage).toStringWithoutPrefix(),
  //         address: output.publicKey.authKey().derivedAddress().toString(),
  //       };

  //       const { data } = await postAptosPepperService<
  //         {
  //           public_key: string;
  //           signature: string;
  //           message: string;
  //           address: string;
  //         },
  //         { success: boolean }
  //       >({
  //         aptosConfig: options.aptosConfig,
  //         path: "verify",
  //         body,
  //         originMethod: "verifySignature",
  //         overrides: { WITH_CREDENTIALS: false },
  //       });
  //       return data.success;
  //     } catch (error) {
  //       console.error(error);
  //       return false;
  //     }
  //   }
  // }

  return output.publicKey.verifySignature({
    message: signingMessage,
    signature: output.signature,
  });
}
