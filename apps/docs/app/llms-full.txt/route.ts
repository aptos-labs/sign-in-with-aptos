import { NextResponse } from "next/server";

const LLMS_FULL_CONTENT = `# Sign in with Aptos (SIWA) - Full Documentation

> Authenticate users securely using their Aptos account. A standardized authentication protocol for Aptos accounts.

Source: https://siwa.aptos.dev
GitHub: https://github.com/aptos-labs/sign-in-with-aptos

---

## Introduction

The "Sign in with Aptos" (SIWA) standard introduces a secure and user-friendly way for users to authenticate to off-chain resources by proving ownership of their Aptos account. It simplifies the authentication process by replacing the traditional connect + signMessage flow in the wallet standard with a streamlined one-click signIn method. SIWA leverages Aptos accounts to avoid reliance on traditional schemes like SSO while incorporating security measures to combat phishing attacks and improve user visibility.

### Why is this important?

Authenticating with Aptos accounts is a privacy-first solution that empowers individuals to safeguard their information, personalize their experiences, and maintain freedom from censorship.

By authenticating using Aptos accounts, users have full control over their authentication journey. They can decide what to share and how to log in, ensuring a more secure and customizable experience.

For example, a user may choose to use one of the wallet experiences to authenticate into an application:

- **Petra** – Passwords/Biometric: Fully non-custodial. Requires no information to be shared with Petra, ensuring complete privacy and resistance to censorship.
- **Aptos Connect** – Social Providers: Fully non-custodial. Shares limited information with Aptos Connect including name, email, sub and may be subject to censorship by social providers.

The existing connect + signMessage flow used for authentication presents challenges:
- Lack of standardization — Applications on Aptos lack a unified authentication message format
- Unreadable messages — Authentication messages are displayed in plain text
- Security risks — Malicious websites can deceive users into signing messages intended for legitimate dApps
- Unintuitive — The traditional workflow involves two separate steps

### The Solution

The proposed model builds on established standards, including EIP-4361, CAIP-122, and Sign in with Solana. This standard shifts the responsibility of message construction from dApps to wallets, streamlining the authentication process.

With a Sign in with Aptos (SIWA) flow, wallets can interpret standardized message formats, allowing them to flag potentially illegitimate messages. The wallet standard incorporates critical features such as domain binding, message timestamps, resources, and request IDs.

---

## @aptos-labs/siwa Package

### Quick Start

#### Install dependencies

\`\`\`sh
npm i @aptos-labs/siwa
\`\`\`

#### Setup Backend

\`\`\`ts
import { Hono } from "hono";
import { generateNonce, AptosSignInInput } from "@aptos-labs/siwa";

const app = new Hono();

// Pre-signing endpoint
app.get("/auth/siwa", (c) => {
  const nonce = generateNonce();

  const input = {
    nonce,
    domain: FRONTEND_URL,
    statement: "Sign into to get access to this demo application",
  } satisfies AptosSignInInput;

  setCookie(c, "siwa-input", JSON.stringify(input), {
    httpOnly: true,
    sameSite: "lax",
  });

  return c.json({ data: input });
});

// Verification endpoint
app.post("/auth/siwa/verify", (c) => {
  const { output } = c.req.json();

  const deserializedOutput = await deserializeSignInOutput(output);

  const signatureVerification = verifySignInSignature(deserializedOutput);

  if (!signatureVerification.valid)
    return c.json({ errors: signatureVerification.errors }, 400);

  const expectedInput = getCookie(c, "siwa-input");

  if (!expectedInput) 
    return c.json({ error: "input_not_found" }, 400);

  const messageVerification = verifySignInMessage({
    input: deserializedOutput.input,
    expected: JSON.parse(expectedInput) as AptosSignInInput,
    publicKey: deserializedOutput.publicKey,
  });

  if (!messageVerification.valid)
    return c.json({ errors: messageVerification.errors }, 400);

  // Create and store a session for the user
  return c.json({ data: verification });
});
\`\`\`

#### Setup Frontend

\`\`\`tsx
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { serializeSignInOutput, AptosSignInInput, AptosSignInOutput } from "@aptos-labs/siwa";

export default function SignInPage() {
  const { signIn } = useWallet();

  const handleSignIn = async () => {
    const inputResponse = await fetch("/auth/siwa");
    const input: AptosSignInInput = await inputResponse.json();

    const response: AptosSignInOutput = await signIn(input);

    const verification = await fetch("/auth/siwa/verify", {
      method: "POST",
      body: JSON.stringify({
        output: serializeSignInOutput(response),
      }),
    });

    if (!verification.ok) throw new Error("Failed to verify message");
    // User is signed in, redirect to application
  };

  return (
    <div>
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );
}
\`\`\`

---

## API Reference

### createSignInMessage

Creates a human readable SIWA message to be displayed to the user.

\`\`\`tsx
import { createSignInMessage, type AptosSignInInput } from "@aptos-labs/siwa";

const input: AptosSignInInput = {
  domain: "example.com",
  address: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123def456",
  uri: "https://example.com",
  statement: "Sign in to Example.com to access your account"
};

const message = createSignInMessage(input);
// Returns:
// "example.com wants you to sign in with your Aptos account:
// 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
// 
// Sign in to Example.com to access your account
// 
// URI: https://example.com
// Version: 1
// Nonce: abc123def456
// Chain ID: aptos:mainnet"
\`\`\`

### createSignInSigningMessage

Creates a signing message from a human readable SIWA message. This signing message is used to be signed by the wallet when the user signs in.

\`\`\`tsx
import { createSignInMessage, createSignInSigningMessage, type AptosSignInInput } from "@aptos-labs/siwa";

const input: AptosSignInInput = {
  domain: "example.com",
  address: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  version: "1",
  chainId: "aptos:mainnet",
  nonce: "abc123def456"
};

const message = createSignInMessage(input);
const signingMessage = createSignInSigningMessage(message); // Uint8Array with domain separator hash + message
\`\`\`

### verifySignInMessage

Verifies an AptosSignInInput against another AptosSignInInput. Typically used to compare the AptosSignInInput acquired from the wallet and the AptosSignInInput stored in the backend.

\`\`\`tsx
import { verifySignInMessage, deserializeSignInOutput, type AptosSignInInput, type SerializedAptosSignInOutput } from "@aptos-labs/siwa";

const expectedInput: AptosSignInInput = {
  domain: "example.com",
  nonce: "abc123def456",
  statement: "Sign in to Example.com to access your account"
};

const serializedOutput: SerializedAptosSignInOutput = // response from serializeSignInOutput
const output = await deserializeSignInOutput(serializedOutput);

const result = await verifySignInMessage({
  expected: expectedInput,
  input: output.input,
  publicKey: output.publicKey
});

if (!result.valid) {
  // Message verification failed: result.errors
}
\`\`\`

### verifySignInSignature

Verifies whether the signature is valid for the given AptosSignInInput and public key.

\`\`\`tsx
import { verifySignInSignature, deserializeSignInOutput, type SerializedAptosSignInOutput } from "@aptos-labs/siwa";

const serializedOutput: SerializedAptosSignInOutput = // response from serializeSignInOutput
const output = await deserializeSignInOutput(serializedOutput);

const result = await verifySignInSignature({
  publicKey: output.publicKey,
  signature: output.signature,
  input: output.input,
});

if (!result.valid) {
  // Signature verification failed: result.errors
}
\`\`\`

### generateNonce

Generates a randomized nonce used to prevent replay attacks.

\`\`\`tsx
import { generateNonce, type AptosSignInInput } from "@aptos-labs/siwa";

const nonce = generateNonce(); // "abc123def456ghi789"

const input: AptosSignInInput = {
  domain: "example.com",
  address: "0x1234...",
  version: "1",
  chainId: "aptos:mainnet",
  nonce // Use the generated nonce here
};
\`\`\`

### serializeSignInOutput

Serializes an AptosSignInOutput to a versioned SerializedAptosSignInOutput for transfer from frontend to backend.

\`\`\`tsx
import { serializeSignInOutput, type AptosSignInOutput } from "@aptos-labs/siwa";

const output: AptosSignInOutput = // response from signIn function
const serialized = serializeSignInOutput(output);
// { version: "2", type: "ed25519", signature: "0x...", input: {...}, publicKey: "0x..." }
\`\`\`

### deserializeSignInOutput

Deserializes a serialized SIWA output for consumption on the backend.

\`\`\`tsx
import { deserializeSignInOutput, type SerializedAptosSignInOutput } from "@aptos-labs/siwa";

const serializedOutput: SerializedAptosSignInOutput = // response from serializeSignInOutput
const deserialized = await deserializeSignInOutput(serializedOutput);
// { version: "2", type: "ed25519", signature: Ed25519Signature, publicKey: Ed25519PublicKey, input: {...} }
\`\`\`

### deserializeSignInPublicKey

Deserializes a serialized public key using the scheme provided.

\`\`\`tsx
import { deserializeSignInPublicKey } from "@aptos-labs/siwa";
import { Ed25519PublicKey, SigningScheme } from "@aptos-labs/ts-sdk";

const originalKey = new Ed25519PublicKey(new Uint8Array(32));
const serializedHex = originalKey.bcsToHex().toString();

// Deserialize using scheme string
const deserializedKey1 = await deserializeSignInPublicKey("ed25519", serializedHex);

// Deserialize using SigningScheme enum
const deserializedKey2 = await deserializeSignInPublicKey(SigningScheme.Ed25519, serializedHex);

// Other schemes
const singleKeyHex = "0x1234567890abcdef...";
const singleKey = await deserializeSignInPublicKey("single_key", singleKeyHex);
\`\`\`

### deserializeSignInSignature

Deserializes a serialized signature using the scheme provided.

\`\`\`tsx
import { deserializeSignInSignature } from "@aptos-labs/siwa";
import { Ed25519Signature, SigningScheme } from "@aptos-labs/ts-sdk";

const originalSignature = new Ed25519Signature(new Uint8Array(64));
const serializedHex = originalSignature.bcsToHex().toString();

const deserializedSig1 = await deserializeSignInSignature("ed25519", serializedHex);
const deserializedSig2 = await deserializeSignInSignature(SigningScheme.Ed25519, serializedHex);
\`\`\`

### getSignInPublicKeyScheme

Gets the signing scheme of a public key.

\`\`\`tsx
import { getSignInPublicKeyScheme } from "@aptos-labs/siwa";
import { Ed25519PublicKey, AnyPublicKey, SigningScheme } from "@aptos-labs/ts-sdk";

const ed25519Key = new Ed25519PublicKey(new Uint8Array(32));
const scheme1 = await getSignInPublicKeyScheme(ed25519Key); // "ed25519"

const singleKey = new AnyPublicKey(ed25519Key);
const scheme2 = await getSignInPublicKeyScheme(singleKey); // "single_key"

const scheme3 = await getSignInPublicKeyScheme(SigningScheme.Ed25519); // "ed25519"
\`\`\`

### isValidPublicKeyScheme

Checks if a public key scheme is valid.

\`\`\`tsx
import { isValidPublicKeyScheme } from "@aptos-labs/siwa";

isValidPublicKeyScheme("ed25519"); // true
isValidPublicKeyScheme("multi_ed25519"); // true
isValidPublicKeyScheme("single_key"); // true
isValidPublicKeyScheme("multi_key"); // true
isValidPublicKeyScheme("invalid_scheme"); // false
\`\`\`

---

## @aptos-labs/wallet-adapter-react Package

### Quick Start

#### Install dependencies

\`\`\`sh
npm i @aptos-labs/wallet-adapter-react
\`\`\`

#### Setup Wallet Adapter

\`\`\`tsx
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

export default function WalletAdapterProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider>
      {children}
    </AptosWalletAdapterProvider>
  )
}
\`\`\`

#### Use the signIn function

\`\`\`tsx
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function ConnectButton() {
  const { signIn } = useWallet();

  const handleSignIn = async () => {
    const input: AptosSignInInput = // Logic to fetch the AptosSignInInput
    const output: AptosSignInOutput = await signIn(input);
    // Handle the sign in response
  }

  return <button onClick={handleSignIn}>Connect</button>;
}
\`\`\`

### Auto Connect

The WalletAdapterProvider accepts an autoConnect prop for automatic wallet connection with SIWA support.

\`\`\`tsx
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

export default function WalletAdapterProvider({ children }: { children: React.ReactNode }) {
  const autoConnect = async (core: WalletCore, adapter: AdapterWallet) => {
    const isLoggedIn: boolean = // logic to determine if user is logged in
  
    if (!adapter.features["aptos:signIn"] || isLoggedIn) {
      return true; // Proceed with regular wallet connection
    }

    const input: AptosSignInInput = // logic to fetch AptosSignInInput

    const output: AptosSignInOutput = await core.signIn({
      walletName: adapter.name,
      input: input.data,
    });

    // Handle sign in response
    return false; // SIWA flow complete, skip regular connection
  }

  return (
    <AptosWalletAdapterProvider autoConnect={autoConnect}>
      {children}
    </AptosWalletAdapterProvider>
  )
}
\`\`\`

### Wallet Compatibility

Check for wallet compatibility using the useWallet hook:

\`\`\`tsx
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const { wallet } = useWallet();

if (wallet?.features["aptos:signIn"]) {
  // The wallet supports the SIWA flow
}
\`\`\`

---

## Wallet Integrations

SIWA is designed to be integrated directly into wallets using the @aptos-labs/wallet-standard.

### Supported wallets

- Petra (https://petra.app)
- Aptos Connect (https://aptosconnect.com)

---

## External Resources

- AIP-116: https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-116.md
- GitHub Repository: https://github.com/aptos-labs/sign-in-with-aptos
- Wallet Adapter Documentation: https://aptos.dev/en/build/sdks/wallet-adapter/dapp
- EIP-4361: https://eips.ethereum.org/EIPS/eip-4361
- CAIP-122: https://chainagnostic.org/CAIPs/caip-122
`;

export async function GET() {
  return new NextResponse(LLMS_FULL_CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
