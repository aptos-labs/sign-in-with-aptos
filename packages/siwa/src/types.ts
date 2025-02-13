export type VerificationResult<T> =
  | {
      valid: true;
      data: T;
    }
  | {
      valid: false;
      errors: VerificationError[];
    };

export type VerificationError =
  | VerificationComparisonError
  | VerificationSignatureError
  | VerificationMessageError;

export type VerificationComparisonError =
  | "message_domain_mismatch"
  | "message_address_mismatch"
  | "message_statement_mismatch"
  | "message_uri_mismatch"
  | "message_version_mismatch"
  | "message_chain_id_mismatch"
  | "message_nonce_mismatch"
  | "message_issued_at_mismatch"
  | "message_expiration_time_mismatch"
  | "message_not_before_mismatch"
  | "message_request_id_mismatch"
  | "message_resources_missing"
  | "message_resources_mismatch"
  | "message_resources_unexpected";

export type VerificationSignatureError = "invalid_signature";

export type VerificationMessageError =
  | "invalid_message"
  | "message_domain_missing"
  | "message_address_missing"
  | "message_statement_missing"
  | "message_version_missing"
  | "message_chain_id_missing";
