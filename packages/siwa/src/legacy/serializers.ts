import type { PublicKey, Signature } from "@aptos-labs/ts-sdk";
import type { AptosSignInOutput } from "@aptos-labs/wallet-standard";
import {
	deserializeSignInPublicKey,
	deserializeSignInSignature,
	isValidPublicKeyScheme,
} from "../utils.js";

export const CURRENT_LEGACY_SERIALIZATION_VERSION = "2";

export type LegacySerializationVersion = "2";

export type SerializedLegacyAptosSignInOutput = {
	version: "2";
	type: string;
	signature: string;
	message: string;
	publicKey: string;
};

export type DeserializedLegacyAptosSignInOutput = {
	version: "2";
	type: string;
	signature: Signature;
	message: string;
	publicKey: PublicKey;
};

export const serializeLegacySignInOutput = (
	output: Pick<AptosSignInOutput, "type" | "signature" | "account"> & {
		message: string;
	},
): SerializedLegacyAptosSignInOutput => ({
	version: CURRENT_LEGACY_SERIALIZATION_VERSION,
	type: output.type,
	signature: output.signature.bcsToHex().toString(),
	message: output.message,
	publicKey: output.account.publicKey.bcsToHex().toString(),
});

export const deserializeLegacySignInOutput = async (
	serialized: SerializedLegacyAptosSignInOutput,
): Promise<DeserializedLegacyAptosSignInOutput> => {
	const { version } = serialized;

	if (version === "2") {
		if (!isValidPublicKeyScheme(serialized.type)) {
			throw new Error(`Unexpected public key scheme: ${serialized.type}`);
		}

		return {
			version: "2",
			type: serialized.type,
			signature: await deserializeSignInSignature(
				serialized.type,
				serialized.signature,
			),
			publicKey: await deserializeSignInPublicKey(
				serialized.type,
				serialized.publicKey,
			),
			message: serialized.message,
		};
	}

	throw new Error(`Unexpected serialization version: ${version}`);
};
