import type { AptosSignInBoundFields } from "@aptos-labs/wallet-standard";

export type {
  AptosSignInBoundFields,
  AptosSignInInput,
  AptosSignInOutput,
} from "@aptos-labs/wallet-standard";
export * from "./core.js";
export * from "./serializers.js";
export {
  VerificationComparisonError,
  VerificationError,
  VerificationMessageError,
  VerificationResult,
  VerificationSignatureError,
} from "./types.js";
export * from "./utils.js";

/**
 * @deprecated Use `AptosSignInBoundFields` instead.
 */
export type AptosSignInRequiredFields = AptosSignInBoundFields;
