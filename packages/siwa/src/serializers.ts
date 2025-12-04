import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import type {
	AptosSignInBoundFields,
	AptosSignInInput,
	AptosSignInOutput,
} from "@aptos-labs/wallet-standard";
import {
	deserializeSignInPublicKey,
	deserializeSignInSignature,
	isValidPublicKeyScheme,
} from "./utils.js";

export const CURRENT_SERIALIZATION_VERSION = "3";

export type SerializationVersion = "3";

export type SerializedAptosSignInOutput = {
	version: "3";
	type: string;
	signature: string;
	input: AptosSignInInput & AptosSignInBoundFields;
	publicKey: string;
};

export type DeserializedAptosSignInOutput = {
	version: "3";
	type: string;
	signature: Signature;
	input: AptosSignInInput & AptosSignInBoundFields;
	publicKey: PublicKey;
};

/**
 * A helper function that serializes a `AptosSignInOutput` to a versioned `SerializedAptosSignInOutput`. This format is used to help transfer
 * the `AptosSignInOutput` from the frontend to the backend.
 *
 * @param output - The `AptosSignInOutput` to serialize.
 * @returns The serialized `AptosSignInOutput`.
 */
export const serializeSignInOutput = (
	output: Pick<AptosSignInOutput, "type" | "signature" | "input" | "account">,
): SerializedAptosSignInOutput => ({
	version: CURRENT_SERIALIZATION_VERSION,
	type: output.type,
	signature: output.signature.bcsToHex().toString(),
	input: output.input,
	publicKey: output.account.publicKey.bcsToHex().toString(),
});

/**
 * A helper function that deserializes a `SerializedAptosSignInOutput` to a `AptosSignInOutput`. This format is used to help transfer
 * the `AptosSignInOutput` from the backend to the frontend.
 *
 * @param serialized - The `SerializedAptosSignInOutput` to deserialize.
 * @returns The deserialized `AptosSignInOutput`.
 */
export const deserializeSignInOutput = async (
	serialized: SerializedAptosSignInOutput,
): Promise<DeserializedAptosSignInOutput> => {
	const { version } = serialized;

	if (version === "3") {
		if (!isValidPublicKeyScheme(serialized.type)) {
			throw new Error(`Unexpected public key scheme: ${serialized.type}`);
		}

		return {
			version: "3",
			type: serialized.type,
			signature: await deserializeSignInSignature(
				serialized.type,
				serialized.signature,
			),
			input: serialized.input,
			publicKey: await deserializeSignInPublicKey(
				serialized.type,
				serialized.publicKey,
			),
		};
	}

	throw new Error(`Unexpected serialization version: ${version}`);
};
