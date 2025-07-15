import {
  AccountAddress,
  AccountPublicKey,
  type Aptos,
  type PublicKey,
  type Signature,
} from "@aptos-labs/ts-sdk";
import type {
  AptosSignInBoundFields,
  AptosSignInInput,
} from "@aptos-labs/wallet-standard";
import { sha3_256 } from "@noble/hashes/sha3";
import { arraysEqual, asyncTryOrDefault, mainnet } from "./internal.js";
import { verifySignature } from "./signatures.js";
import type {
  VerificationError,
  VerificationMessageError,
  VerificationResult,
  VerificationResultWithData,
} from "./types.js";

/**
 * Create a SIWA message from the input following the ABNF format defined in the Sign in with Aptos specifications.
 *
 * @param input The input to create the SIWA message from.
 *
 * @returns The SIWA message text.
 */
export function createSignInMessage(
  input: AptosSignInInput & AptosSignInBoundFields,
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

/**
 * Generate a signing message using the SIWA signing algorithm.
 * ( sha3_256(b"SIGN_IN_WITH_APTOS::" ) || <message> )
 *
 * @param message The SIWA message to sign.
 *
 * @returns The signing message.
 */
export function createSignInSigningMessage(message: string): Uint8Array {
  const domainSeparator = "SIGN_IN_WITH_APTOS::";
  const domainSeparatorHash = sha3_256(domainSeparator);
  return new Uint8Array([
    ...domainSeparatorHash,
    ...new TextEncoder().encode(message),
  ]);
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

/**
 * Parse a SIWA message into an `AptosSignInInput` object with the required fields.
 *
 * @param text The SIWA message to parse.
 *
 * @returns The parsed `AptosSignInInput` object with the required fields.
 */
export function parseSignInMessage(
  text: string,
): VerificationResultWithData<AptosSignInInput & AptosSignInBoundFields> {
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
 * Verifies a SIWA plain text message against expected `AptosSignInInput` fields (including required fields).
 *
 * @param params.publicKey The public key of the user that is signing in.
 * @param params.expected The expected fields to verify against the input.
 * @param params.message The SIWA plain text message to verify.
 *
 * @param options.aptosConfig The Aptos configuration to use for the verification.
 * @param options.excludedResources The resources to exclude from the verification.
 *
 * @returns The verification result.
 */
export async function verifySignInMessage(
  params: {
    publicKey: PublicKey;
    // From the beginning of the flow
    expected: AptosSignInInput & { domain: string };
    // From wallet, AptosSignInOutput
    input: AptosSignInInput & AptosSignInBoundFields;
  },
  options: { aptos?: Aptos; excludedResources?: string[] } = {},
): Promise<VerificationResult> {
  const { expected, input, publicKey } = params;

  if (!(publicKey instanceof AccountPublicKey)) {
    return { valid: false, errors: ["invalid_public_key"] };
  }

  // 1. Check that the authentication key of the account at `input.address` matches the `PublicKey`'s derived authentication key
  const accountAddress = input.address;
  const accountAuthenticationKey = await asyncTryOrDefault(
    async () =>
      (await (options.aptos ?? mainnet).getAccountInfo({ accountAddress }))
        .authentication_key,
    accountAddress,
  );
  const publicKeyAuthenticationKey = publicKey.authKey().derivedAddress();
  if (
    !AccountAddress.from(accountAuthenticationKey, {
      maxMissingChars: 63,
    }).equals(publicKeyAuthenticationKey)
  ) {
    return { valid: false, errors: ["invalid_auth_key"] };
  }

  // 2. Check if the `expected` fields match the `input` fields
  const errors: VerificationError[] = [];

  if (expected.domain && expected.domain !== input.domain)
    errors.push("message_domain_mismatch");
  if (expected.address && expected.address !== input.address)
    errors.push("message_address_mismatch");
  if (expected.statement !== input.statement)
    errors.push("message_statement_mismatch");
  if (expected.uri && expected.uri !== input.uri)
    errors.push("message_uri_mismatch");
  if (expected.version && expected.version !== input.version)
    errors.push("message_version_mismatch");
  if (expected.chainId && expected.chainId !== input.chainId)
    errors.push("message_chain_id_mismatch");
  if (expected.nonce !== input.nonce) errors.push("message_nonce_mismatch");
  if (expected.issuedAt !== input.issuedAt)
    errors.push("message_issued_at_mismatch");
  if (expected.expirationTime !== input.expirationTime)
    errors.push("message_expiration_time_mismatch");
  if (expected.notBefore !== input.notBefore)
    errors.push("message_not_before_mismatch");
  if (expected.requestId !== input.requestId)
    errors.push("message_request_id_mismatch");
  if (expected.resources) {
    if (!input.resources) {
      errors.push("message_resources_missing");
    } else if (
      !arraysEqual(
        expected.resources,
        input.resources,
        // If there is resource injection, exclude the resource since the expected value is not known
        options?.excludedResources,
      )
    ) {
      errors.push("message_resources_mismatch");
    }
  } else if (input.resources) {
    errors.push("message_resources_unexpected");
  }

  // 3. Do timebased comparisons on `expirationTime` and `notBefore`
  const currentTime = new Date();

  if (
    expected.expirationTime &&
    currentTime.getTime() >= new Date(expected.expirationTime).getTime()
  ) {
    errors.push("message_expired");
  }

  if (
    expected.notBefore &&
    currentTime.getTime() < new Date(expected.notBefore).getTime()
  ) {
    errors.push("message_not_yet_valid");
  }

  if (errors.length) return { valid: false, errors };

  return { valid: true };
}

/**
 * Using the `publicKey` and `signature`, verify that the `signature` is valid for the `message`.
 *
 * @param output The `AptosSignInOutput` to verify against the input.
 *
 * @returns The `AptosSignInInput` fields that are parsed from the message.
 */
export async function verifySignInSignature(
  output: {
    publicKey: PublicKey;
    signature: Signature;
    input: AptosSignInInput & AptosSignInBoundFields;
  },
  options: { aptos?: Aptos } = {},
): Promise<VerificationResult> {
  const siwaMessage = createSignInMessage(output.input);

  const signingMessage = createSignInSigningMessage(siwaMessage);

  const isSignatureValid = await verifySignature(
    {
      publicKey: output.publicKey,
      signature: output.signature,
      signingMessage,
    },
    options,
  );
  if (!isSignatureValid) return { valid: false, errors: ["invalid_signature"] };

  return { valid: true };
}
