import { describe } from "node:test";
import {
	EIP1193DerivedPublicKey,
	EIP1193PersonalSignature,
} from "@aptos-labs/derived-wallet-ethereum";
import { SolanaDerivedPublicKey } from "@aptos-labs/derived-wallet-solana";
import {
	AnyPublicKey,
	AnySignature,
	Ed25519PublicKey,
	Ed25519Signature,
	MultiEd25519PublicKey,
	MultiEd25519Signature,
	MultiKey,
	MultiKeySignature,
	SigningScheme,
} from "@aptos-labs/ts-sdk";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { expect, test } from "vitest";
import {
	deserializeSignInPublicKey,
	deserializeSignInSignature,
	generateNonce,
} from "../../src/utils.js";

describe("deserializeSignInPublicKey", () => {
	test("should deserialize a Ed25519PublicKey using string", async () => {
		const publicKey = new Ed25519PublicKey(new Uint8Array(32));
		expect(
			await deserializeSignInPublicKey("ed25519", publicKey.bcsToBytes()),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a MultiEd25519PublicKey using string", async () => {
		const publicKey = new MultiEd25519PublicKey({
			publicKeys: [
				new Ed25519PublicKey(new Uint8Array(32)),
				new Ed25519PublicKey(new Uint8Array(32)),
			],
			threshold: 1,
		});
		expect(
			await deserializeSignInPublicKey("multi_ed25519", publicKey.bcsToBytes()),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a SingleKey using string", async () => {
		const publicKey = new AnyPublicKey(
			new Ed25519PublicKey(new Uint8Array(32)),
		);
		expect(
			await deserializeSignInPublicKey("single_key", publicKey.bcsToBytes()),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a MultiKey using string", async () => {
		const publicKey = new MultiKey({
			publicKeys: [
				new Ed25519PublicKey(new Uint8Array(32)),
				new Ed25519PublicKey(new Uint8Array(32)),
			],
			signaturesRequired: 1,
		});
		expect(
			await deserializeSignInPublicKey("multi_key", publicKey.bcsToBytes()),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a SolanaDerivedPublicKey using string", async () => {
		const publicKey = new SolanaDerivedPublicKey({
			domain: "example.com",
			solanaPublicKey: new SolanaPublicKey(new Uint8Array(32)),
			authenticationFunction: "0x1::solana_derivable_account::authenticate",
		});
		expect(
			await deserializeSignInPublicKey(
				"solana_derived",
				publicKey.bcsToBytes(),
			),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a EIP1193DerivedPublicKey using string", async () => {
		const publicKey = new EIP1193DerivedPublicKey({
			domain: "example.com",
			ethereumAddress: "0x1234567890123456789012345678901234567890",
			authenticationFunction: "0x1::ethereum_derivable_account::authenticate",
		});
		expect(
			await deserializeSignInPublicKey(
				"ethereum_derived",
				publicKey.bcsToBytes(),
			),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a Ed25519PublicKey using SigningScheme", async () => {
		const publicKey = new Ed25519PublicKey(new Uint8Array(32));
		expect(
			await deserializeSignInPublicKey(
				SigningScheme.Ed25519,
				publicKey.bcsToBytes(),
			),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a MultiEd25519PublicKey using SigningScheme", async () => {
		const publicKey = new MultiEd25519PublicKey({
			publicKeys: [
				new Ed25519PublicKey(new Uint8Array(32)),
				new Ed25519PublicKey(new Uint8Array(32)),
			],
			threshold: 1,
		});
		expect(
			await deserializeSignInPublicKey(
				SigningScheme.MultiEd25519,
				publicKey.bcsToBytes(),
			),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a SingleKey using SigningScheme", async () => {
		const publicKey = new AnyPublicKey(
			new Ed25519PublicKey(new Uint8Array(32)),
		);
		expect(
			await deserializeSignInPublicKey(
				SigningScheme.SingleKey,
				publicKey.bcsToBytes(),
			),
		).toStrictEqual(publicKey);
	});

	test("should deserialize a MultiKey using SigningScheme", async () => {
		const publicKey = new MultiKey({
			publicKeys: [
				new Ed25519PublicKey(new Uint8Array(32)),
				new Ed25519PublicKey(new Uint8Array(32)),
			],
			signaturesRequired: 1,
		});
		expect(
			await deserializeSignInPublicKey(
				SigningScheme.MultiKey,
				publicKey.bcsToBytes(),
			),
		).toStrictEqual(publicKey);
	});

	test("throw error if the public key scheme string is not valid", async () => {
		await expect(
			deserializeSignInPublicKey("invalid" as "ed25519", new Uint8Array(64)),
		).rejects.toThrow();
		await expect(
			deserializeSignInPublicKey(100 as SigningScheme, new Uint8Array(64)),
		).rejects.toThrow();
	});
});

describe("deserializeSignInSignature", () => {
	test("should deserialize a Ed25519Signature using string", async () => {
		const signature = new Ed25519Signature(new Uint8Array(64));
		expect(
			await deserializeSignInSignature("ed25519", signature.bcsToBytes()),
		).toStrictEqual(signature);
	});

	test("should deserialize a MultiEd25519Signature using string", async () => {
		const signature = new MultiEd25519Signature({
			signatures: [new Ed25519Signature(new Uint8Array(64))],
			bitmap: [0],
		});
		expect(
			await deserializeSignInSignature("multi_ed25519", signature.bcsToBytes()),
		).toStrictEqual(signature);
	});

	test("should deserialize a SingleKey using string", async () => {
		const signature = new AnySignature(
			new Ed25519Signature(new Uint8Array(64)),
		);
		expect(
			await deserializeSignInSignature("single_key", signature.bcsToBytes()),
		).toStrictEqual(signature);
	});

	test("should deserialize a MultiKey using string", async () => {
		const signature = new MultiKeySignature({
			signatures: [new Ed25519Signature(new Uint8Array(64))],
			bitmap: [0],
		});
		expect(
			await deserializeSignInSignature("multi_key", signature.bcsToBytes()),
		).toStrictEqual(signature);
	});

	test("should deserialize a SolanaDerivedSignature using string", async () => {
		// Solana derived uses Ed25519Signature internally
		const signature = new Ed25519Signature(new Uint8Array(64));
		expect(
			await deserializeSignInSignature(
				"solana_derived",
				signature.bcsToBytes(),
			),
		).toStrictEqual(signature);
	});

	test("should deserialize a EIP1193PersonalSignature using string", async () => {
		const signature = new EIP1193PersonalSignature(new Uint8Array(65));
		expect(
			await deserializeSignInSignature(
				"ethereum_derived",
				signature.bcsToBytes(),
			),
		).toStrictEqual(signature);
	});

	test("should deserialize a Ed25519Signature using SigningScheme", async () => {
		const signature = new Ed25519Signature(new Uint8Array(64));
		expect(
			await deserializeSignInSignature(
				SigningScheme.Ed25519,
				signature.bcsToBytes(),
			),
		).toStrictEqual(signature);
	});

	test("should deserialize a MultiEd25519Signature using SigningScheme", async () => {
		const signature = new MultiEd25519Signature({
			signatures: [new Ed25519Signature(new Uint8Array(64))],
			bitmap: [0],
		});
		expect(
			await deserializeSignInSignature(
				SigningScheme.MultiEd25519,
				signature.bcsToBytes(),
			),
		).toStrictEqual(signature);
	});

	test("should deserialize a SingleKey using SigningScheme", async () => {
		const signature = new AnySignature(
			new Ed25519Signature(new Uint8Array(64)),
		);
		expect(
			await deserializeSignInSignature(
				SigningScheme.SingleKey,
				signature.bcsToBytes(),
			),
		).toStrictEqual(signature);
	});

	test("should deserialize a MultiKey using SigningScheme", async () => {
		const signature = new MultiKeySignature({
			signatures: [new Ed25519Signature(new Uint8Array(64))],
			bitmap: [0],
		});
		expect(
			await deserializeSignInSignature(
				SigningScheme.MultiKey,
				signature.bcsToBytes(),
			),
		).toStrictEqual(signature);
	});

	test("throw error if the signature scheme string is not valid", async () => {
		await expect(
			deserializeSignInSignature("invalid" as "ed25519", new Uint8Array(64)),
		).rejects.toThrow();
		await expect(
			deserializeSignInSignature(100 as SigningScheme, new Uint8Array(64)),
		).rejects.toThrow();
	});
});

describe("generateNonce", () => {
	test("should generate a random nonce", () => {
		const found = new Set<string>();
		for (let i = 0; i < 100; i++) {
			const nonce = generateNonce();
			expect(found.has(nonce)).toBe(false);
			found.add(nonce);
		}
	});
});
