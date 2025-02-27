import { createHighlighter } from "shiki";
import CodeExamples from "./CodeExamples";

export interface CodeOption {
  title: string;
  description: string;
  code: string;
}

const options: CodeOption[] = [
  {
    title: "1. Setup Backend",
    description:
      "Create two endpoints to support Aptos account authentication to your off-chain backend.",
    code: `import { getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { z } from "zod";

const auth = new Hono();

auth.get("/auth/siwa", (c) => {
  const nonce = generateNonce();

  const input = {
    nonce,
    statement: "Sign into to get access to this demo application",
  } satisfies AptosSignInInput;

  setCookie(c, "siwa-input", JSON.stringify(input), {
    httpOnly: true,
    sameSite: "lax",
  });

  return c.json({ data: input });
});

auth.post(
  "/auth/siwa/callback",
  async (c) => {
    const { output } = c.req.valid("json");

    const input = getCookie(c, "siwa-input");
    if (!input) return c.json({ error: "input_not_found" }, 400);

    const deserializedOutput = deserializeSignInOutput(output);

    const verification = await verifySignIn(
      {
        ...(JSON.parse(input) as AptosSignInInput),
        domain: FRONTEND_URL,
      },
      deserializedOutput
    );

    if (!verification.valid) {
      return c.json({ error: \`\${verification.errors.join(", ")}\` }, 400);
    }

    // ... Generate and store a session for the user

    return c.json({ data: true });
  }
);`,
  },
  {
    title: "2. Setup Frontend Utilities",
    description:
      "Declare two utilities to interact with the backend endpoints.",
    code: `import type {
  AptosSignInInput,
  AptosSignInOutput,
} from "@aptos-labs/wallet-adapter-react";
import { serializeSignInOutput } from "@aptos-labs/siwa";

export const fetchSignInInput = async () => {
  const response = await fetch(\`\${BACKEND_URL}/auth/siwa\`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch sign in input");
  return (await response.json()) as { data: AptosSignInInput };
};

export const loginWithSignInOutput = async (output: AptosSignInOutput) => {
  const response = await fetch(\`\${BACKEND_URL}/auth/siwa/callback\`, {
    credentials: "include",
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ output: serializeSignInOutput(output) }),
  });
  if (!response.ok) throw new Error("Failed to login with sign in output");
  return (await response.json()) as { data: boolean };
};
`,
  },
  {
    title: "3. Integrate with the Wallet Adapter",
    description: "First class support for SIWA using the React wallet adapter.",
    code: `import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  fetchSignInInput,
  loginWithSignInOutput,
} from "@/lib/auth";

export default function ConnectButton() {
  const { signIn, disconnect } = useWallet();

  const handleSignIn = async () => {
    const input = await fetchSignInInput();

    const output = await signIn("Petra", input.data);

    try {
      await loginWithSignInOutput(output);
    } catch (error) {
      // If there was an issue signing in, disconnect the wallet.
      disconnect();
      throw error;
    }
  };

  return <button onClick={handleSignIn}>Sign in with Aptos</button>;
}`,
  },
  {
    title: "4. Implement Auto Connect Behavior",
    description:
      "Add support for SIWA in the auto connect behavior of the wallet adapter.",
    code: `import {
  AptosWalletAdapterProvider,
  type Wallet,
  type WalletCore,
} from "@aptos-labs/wallet-adapter-react";
import { type PropsWithChildren, useCallback } from "react";
import { fetchSignInInput, loginWithSignInOutput } from "@/lib/auth";

export default function WalletAdapterProvider({ children }: PropsWithChildren) {
  const autoConnect = useCallback(async (core: WalletCore, wallet: Wallet) => {
    if (!wallet.signIn) return true;

    const input = await fetchSignInInput();

    const output = await core.signIn(wallet.name, input.data);

    try {
      await loginWithSignInOutput(output);
    } catch (error) {
      return true;
    }

    return false;
  }, []);

  return (
    <AptosWalletAdapterProvider autoConnect={autoConnect}>
      {children}
    </AptosWalletAdapterProvider>
  );
}`,
  },
];

export default async function Code() {
  const highlighter = await createHighlighter({
    langs: ["typescript"],
    themes: ["github-light", "github-dark"],
  });

  const highlightedOptions = options.map((e) => ({
    ...e,
    code: highlighter.codeToHtml(e.code, {
      lang: "typescript",
      themes: { light: "github-light", dark: "github-dark" },
    }),
  }));

  return (
    <section className="relative mx-auto container">
      <div className="border-x border-border uppercase text-muted-foreground flex items-center justify-center py-8">
        Get started with these examples
      </div>

      <CodeExamples options={highlightedOptions} />
    </section>
  );
}
