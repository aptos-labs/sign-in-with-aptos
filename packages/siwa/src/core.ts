import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import type {
  AptosSignInInput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-standard";
import { sha3_256 } from "@noble/hashes/sha3";
import { arraysEqual } from "./internal.js";
import type {
  VerificationComparisonError,
  VerificationMessageError,
  VerificationResult,
} from "./types.js";

/**
 * Create a SignIn message text from the input following the ABNF format defined in the Sign in with Aptos
 * specifications.
 *
 * @param input The input to create the SignIn message text from.
 *
 * @returns The SignIn message text.
 */
export function createSignInMessageText(
  input: AptosSignInInput & AptosSignInRequiredFields,
): string {
  let message = `${input.domain} wants you to sign in with your Aptos account:\n`;
  message += `${input.address}`;

  if (input.statement) {
    message += `\n\n${input.statement}`;
  }

  const fields: string[] = [];
  if (input.uri) {
    fields.push(`URI: ${input.uri}`);
  }
  if (input.version) {
    fields.push(`Version: ${input.version}`);
  }
  if (input.nonce) {
    fields.push(`Nonce: ${input.nonce}`);
  }
  if (input.issuedAt) {
    fields.push(`Issued At: ${input.issuedAt}`);
  }
  if (input.expirationTime) {
    fields.push(`Expiration Time: ${input.expirationTime}`);
  }
  if (input.notBefore) {
    fields.push(`Not Before: ${input.notBefore}`);
  }
  if (input.requestId) {
    fields.push(`Request ID: ${input.requestId}`);
  }
  if (input.chainId) {
    fields.push(`Chain ID: ${input.chainId}`);
  }
  if (input.resources) {
    fields.push("Resources:");
    for (const resource of input.resources) {
      fields.push(`- ${resource}`);
    }
  }

  if (fields.length) {
    message += `\n\n${fields.join("\n")}`;
  }

  return message;
}

const DOMAIN =
  "(?<domain>[^\\n]+?) wants you to sign in with your Aptos account:\\n";
const ADDRESS = "(?<address>[^\\n]+)(?:\\n|$)";
const STATEMENT = "(?:\\n(?<statement>[\\S\\s]*?)(?:\\n|$))??";
const URI = "(?:\\nURI: (?<uri>[^\\n]+))?";
const VERSION = "(?:\\nVersion: (?<version>[^\\n]+))?";
const NONCE = "(?:\\nNonce: (?<nonce>[^\\n]+))?";
const ISSUED_AT = "(?:\\nIssued At: (?<issuedAt>[^\\n]+))?";
const EXPIRATION_TIME = "(?:\\nExpiration Time: (?<expirationTime>[^\\n]+))?";
const NOT_BEFORE = "(?:\\nNot Before: (?<notBefore>[^\\n]+))?";
const REQUEST_ID = "(?:\\nRequest ID: (?<requestId>[^\\n]+))?";
const CHAIN_ID = "(?:\\nChain ID: (?<chainId>[^\\n]+))?";
const RESOURCES = "(?:\\nResources:(?<resources>(?:\\n- [^\\n]+)*))?";
const FIELDS = `${URI}${VERSION}${NONCE}${ISSUED_AT}${EXPIRATION_TIME}${NOT_BEFORE}${REQUEST_ID}${CHAIN_ID}${RESOURCES}`;
const MESSAGE = new RegExp(`^${DOMAIN}${ADDRESS}${STATEMENT}${FIELDS}\\n*$`);

export function parseSignInMessageText(
  text: string,
): VerificationResult<AptosSignInInput & AptosSignInRequiredFields> {
  const match = MESSAGE.exec(text);
  if (!match) return { valid: false, errors: ["invalid_message"] };

  const groups = match.groups;
  if (!groups) return { valid: false, errors: ["invalid_message"] };

  const errors: VerificationMessageError[] = [];

  if (!groups.domain || groups.domain === "undefined")
    errors.push("message_domain_missing");
  if (!groups.address || groups.address === "undefined")
    errors.push("message_address_missing");
  if (!groups.version || groups.version === "undefined")
    errors.push("message_version_missing");
  if (!groups.chainId || groups.chainId === "undefined")
    errors.push("message_chain_id_missing");

  if (errors.length) return { valid: false, errors };

  return {
    valid: true,
    data: {
      domain: groups.domain,
      address: groups.address,
      statement: groups.statement,
      uri: groups.uri,
      version: groups.version,
      nonce: groups.nonce,
      chainId: groups.chainId,
      issuedAt: groups.issuedAt,
      expirationTime: groups.expirationTime,
      notBefore: groups.notBefore,
      requestId: groups.requestId,
      resources: groups.resources?.split("\n- ").slice(1),
    },
  };
}

/**
 * Verifies an input SignIn message against expected fields.
 *
 * @param input The input to verify the message against.
 * @param expected The expected message to verify against the input.
 *
 * @returns The verification result.
 */
export function verifySignInMessage(
  input: AptosSignInInput,
  expected: string,
  options?: { excludedResources?: string[] },
): VerificationResult<AptosSignInInput & AptosSignInRequiredFields> {
  const parsedFields = parseSignInMessageText(expected);
  if (!parsedFields.valid) return parsedFields;

  const errors: VerificationComparisonError[] = [];

  if (input.address && input.address !== parsedFields.data.address)
    errors.push("message_address_mismatch");
  if (input.statement !== parsedFields.data.statement)
    errors.push("message_statement_mismatch");
  if (input.uri && input.uri !== parsedFields.data.uri)
    errors.push("message_uri_mismatch");
  if (input.version && input.version !== parsedFields.data.version)
    errors.push("message_version_mismatch");
  if (input.chainId && input.chainId !== parsedFields.data.chainId)
    errors.push("message_chain_id_mismatch");
  if (input.nonce !== parsedFields.data.nonce)
    errors.push("message_nonce_mismatch");
  if (input.issuedAt !== parsedFields.data.issuedAt)
    errors.push("message_issued_at_mismatch");
  if (input.expirationTime !== parsedFields.data.expirationTime)
    errors.push("message_expiration_time_mismatch");
  if (input.notBefore !== parsedFields.data.notBefore)
    errors.push("message_not_before_mismatch");
  if (input.requestId !== parsedFields.data.requestId)
    errors.push("message_request_id_mismatch");

  // If the domain is unexpectedly provided, it must be verified.
  if (
    // biome-ignore lint/suspicious/noExplicitAny: May be present in the input.
    (input as any).domain &&
    // biome-ignore lint/suspicious/noExplicitAny: May be present in the input.
    (input as any).domain !== parsedFields.data.domain
  )
    errors.push("message_domain_mismatch");

  if (input.resources) {
    if (!parsedFields.data.resources) {
      errors.push("message_resources_missing");
    } else if (
      !arraysEqual(
        input.resources,
        parsedFields.data.resources,
        options?.excludedResources,
      )
    ) {
      errors.push("message_resources_mismatch");
    }
  } else if (parsedFields.data.resources) {
    errors.push("message_resources_unexpected");
  }

  if (errors.length) return { valid: false, errors };

  // TODO: Add time verifications

  return { valid: true, data: parsedFields.data };
}

/**
 * Verifies outputs from a `signIn` method response against input fields.
 *
 * @param input The input to verify the output against.
 * @param output The output to verify against the input.
 *
 * @returns The verification result.
 */
export function verifySignIn(
  input: AptosSignInInput & { domain: string },
  output: { publicKey: PublicKey; signature: Signature; message: string },
  options?: { excludedResources?: string[] },
): VerificationResult<AptosSignInInput & AptosSignInRequiredFields> {
  const messageVerification = verifySignInMessage(
    input,
    output.message,
    options,
  );
  if (!messageVerification.valid) return messageVerification;

  const isSignatureValid = output.publicKey.verifySignature({
    message: generateSignInSigningMessage(output.message),
    signature: output.signature,
  });
  if (!isSignatureValid) return { valid: false, errors: ["invalid_signature"] };

  return { valid: true, data: messageVerification.data };
}

/**
 * Generate a signing message using the Sign in with Aptos signing algorithm.
 * sha3_256( sha3_256(b"SIGN_IN_WITH_APTOS::" ) || <message> )
 *
 * @param message The SIWA message to sign.
 *
 * @returns The signing message.
 */
export function generateSignInSigningMessage(message: string): Uint8Array {
  const domainSeparator = "SIGN_IN_WITH_APTOS::";
  const domainSeparatorHash = sha3_256(domainSeparator);
  return new Uint8Array([
    ...domainSeparatorHash,
    ...new TextEncoder().encode(message),
  ]);
}
