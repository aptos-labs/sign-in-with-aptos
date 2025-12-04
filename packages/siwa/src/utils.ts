import {
	AnyPublicKey,
	AnySignature,
	Deserializer,
	Ed25519PublicKey,
	Ed25519Signature,
	Hex,
	type HexInput,
	MultiEd25519PublicKey,
	MultiEd25519Signature,
	MultiKey,
	MultiKeySignature,
	type PublicKey,
	type Signature,
	SigningScheme,
} from "@aptos-labs/ts-sdk";
import { encodeBase64 } from "./internal.js";

/**
 * Check if the scheme is a valid public key scheme
 *
 * @param scheme The scheme to check.
 *
 * @returns True if the scheme is a valid public key scheme, false otherwise.
 */
export const isValidPublicKeyScheme = (
	scheme: string,
): scheme is
	| "ed25519"
	| "multi_ed25519"
	| "single_key"
	| "multi_key"
	| "solana_derived"
	| "ethereum_derived" => {
	return (
		scheme === "ed25519" ||
		scheme === "multi_ed25519" ||
		scheme === "single_key" ||
		scheme === "multi_key" ||
		scheme === "solana_derived" ||
		scheme === "ethereum_derived"
	);
};

/**
 * Get the signing scheme of a public key.
 *
 * @param value The public key or signing scheme to get the scheme of.
 *
 * @returns The signing scheme of the public key.
 */
export async function getSignInPublicKeyScheme(
	value: SigningScheme | PublicKey,
): Promise<string> {
	// If the value is a PublicKey
	if (typeof value === "object") {
		if (Ed25519PublicKey.isInstance(value)) {
			return "ed25519";
		}
		if (AnyPublicKey.isInstance(value)) {
			return "single_key";
		}
		if (MultiKey.isInstance(value)) {
			return "multi_key";
		}
		if (value instanceof MultiEd25519PublicKey) {
			return "multi_ed25519";
		}
		if (await isModuleAvailable("@aptos-labs/derived-wallet-solana")) {
			const { SolanaDerivedPublicKey } = await import(
				"@aptos-labs/derived-wallet-solana"
			);
			if (SolanaDerivedPublicKey.isInstance(value)) {
				return "solana_derived";
			}
		}
		if (await isModuleAvailable("@aptos-labs/derived-wallet-ethereum")) {
			const { EIP1193DerivedPublicKey } = await import(
				"@aptos-labs/derived-wallet-ethereum"
			);
			if (EIP1193DerivedPublicKey.isInstance(value)) {
				return "ethereum_derived";
			}
		}
		throw new Error(`Unknown public key type for instance: ${value}`);
	}

	// If the value is a SigningScheme
	switch (value) {
		case SigningScheme.Ed25519:
			return "ed25519";
		case SigningScheme.MultiEd25519:
			return "multi_ed25519";
		case SigningScheme.SingleKey:
			return "single_key";
		case SigningScheme.MultiKey:
			return "multi_key";
		default:
			throw new Error(`Unknown public key type for signing scheme: ${value}`);
	}
}

/**
 * Deserialize a public key from a hex string.
 *
 * @param scheme The signing scheme of the public key.
 * @param value The hex string to deserialize.
 *
 * @returns The deserialized public key.
 */
export async function deserializeSignInPublicKey(
	scheme:
		| SigningScheme
		| "ed25519"
		| "multi_ed25519"
		| "single_key"
		| "multi_key"
		| "solana_derived"
		| "ethereum_derived",
	value: HexInput,
): Promise<PublicKey> {
	const deserializer = new Deserializer(Hex.fromHexInput(value).toUint8Array());

	if (typeof scheme !== "string") {
		switch (scheme) {
			case SigningScheme.Ed25519:
				return Ed25519PublicKey.deserialize(deserializer);
			case SigningScheme.MultiEd25519:
				return MultiEd25519PublicKey.deserialize(deserializer);
			case SigningScheme.SingleKey:
				return AnyPublicKey.deserialize(deserializer);
			case SigningScheme.MultiKey:
				return MultiKey.deserialize(deserializer);
			default:
				throw new Error(
					`Unknown public key type for signing scheme: ${scheme}`,
				);
		}
	}

	// If the type is a string
	switch (scheme) {
		case "ed25519":
			return Ed25519PublicKey.deserialize(deserializer);
		case "multi_ed25519":
			return MultiEd25519PublicKey.deserialize(deserializer);
		case "single_key":
			return AnyPublicKey.deserialize(deserializer);
		case "multi_key":
			return MultiKey.deserialize(deserializer);
		case "solana_derived": {
			if (!(await isModuleAvailable("@aptos-labs/derived-wallet-solana"))) {
				throw new Error("Solana derived public key is not supported");
			}
			const { SolanaDerivedPublicKey } = await import(
				"@aptos-labs/derived-wallet-solana"
			);
			return SolanaDerivedPublicKey.deserialize(deserializer);
		}
		case "ethereum_derived": {
			if (!(await isModuleAvailable("@aptos-labs/derived-wallet-ethereum"))) {
				throw new Error("Ethereum derived public key is not supported");
			}
			const { EIP1193DerivedPublicKey } = await import(
				"@aptos-labs/derived-wallet-ethereum"
			);
			return EIP1193DerivedPublicKey.deserialize(deserializer);
		}
		default:
			throw new Error(`Unknown public key type: ${scheme}`);
	}
}

/**
 * Deserialize a signature from a hex string.
 *
 * @param scheme The signing scheme of the signature.
 * @param value The hex string to deserialize.
 *
 * @returns The deserialized signature.
 */
export async function deserializeSignInSignature(
	scheme:
		| SigningScheme
		| "ed25519"
		| "multi_ed25519"
		| "single_key"
		| "multi_key"
		| "solana_derived"
		| "ethereum_derived",
	value: HexInput,
): Promise<Signature> {
	const deserializer = new Deserializer(Hex.fromHexInput(value).toUint8Array());

	if (typeof scheme !== "string") {
		switch (scheme) {
			case SigningScheme.Ed25519:
				return Ed25519Signature.deserialize(deserializer);
			case SigningScheme.MultiEd25519:
				return MultiEd25519Signature.deserialize(deserializer);
			case SigningScheme.SingleKey:
				return AnySignature.deserialize(deserializer);
			case SigningScheme.MultiKey:
				return MultiKeySignature.deserialize(deserializer);
			default:
				throw new Error(`Unknown signature type for signing scheme: ${scheme}`);
		}
	}
	// If the type is a string
	switch (scheme) {
		case "ed25519":
			return Ed25519Signature.deserialize(deserializer);
		case "multi_ed25519":
			return MultiEd25519Signature.deserialize(deserializer);
		case "single_key":
			return AnySignature.deserialize(deserializer);
		case "multi_key":
			return MultiKeySignature.deserialize(deserializer);
		case "solana_derived":
			return Ed25519Signature.deserialize(deserializer);
		case "ethereum_derived": {
			if (!(await isModuleAvailable("@aptos-labs/derived-wallet-ethereum"))) {
				throw new Error("Ethereum derived signature is not supported");
			}
			const { EIP1193PersonalSignature } = await import(
				"@aptos-labs/derived-wallet-ethereum"
			);
			return EIP1193PersonalSignature.deserialize(deserializer);
		}
		default:
			throw new Error(`Unknown signature type: ${scheme}`);
	}
}

/**
 * Generates a random nonce using the `crypto.getRandomValues` API.
 *
 * @returns A random nonce.
 */
export function generateNonce(): string {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return encodeBase64(bytes);
}

/**
 * Check if a module is available.
 *
 * @param mod The module to check.
 *
 * @returns True if the module is available, false otherwise.
 */
const isModuleAvailable = async (mod: string) => {
	return import(mod).then(() => true).catch(() => false);
};
