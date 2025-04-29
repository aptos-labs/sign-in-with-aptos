import type { AptosSignInBoundFields } from "@aptos-labs/wallet-standard";

export * from "./core.js";
export {
  VerificationResult,
  VerificationError,
  VerificationComparisonError,
  VerificationMessageError,
  VerificationSignatureError,
} from "./types.js";
export * from "./utils.js";
export * from "./serializers.js";
export type {
  AptosSignInInput,
  AptosSignInOutput,
  AptosSignInBoundFields,
} from "@aptos-labs/wallet-standard";

/**
 * @deprecated Use `AptosSignInBoundFields` instead.
 */
export type AptosSignInRequiredFields = AptosSignInBoundFields;
