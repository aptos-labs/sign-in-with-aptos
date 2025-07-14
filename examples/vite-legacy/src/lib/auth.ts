import type { AptosSignInBoundFields } from "@aptos-labs/siwa";
import { serializeLegacySignInOutput } from "@aptos-labs/siwa/legacy";
import type {
  AptosSignInInput,
  AptosSignInOutput,
} from "@aptos-labs/wallet-adapter-react";
import { BACKEND_URL } from "@/lib/utils";

export const fetchSignInInputLegacy = async (address: string) => {
  const response = await fetch(
    `${BACKEND_URL}/auth/legacy/siwa?address=${address}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Failed to fetch sign in input");
  return (await response.json()) as {
    data: AptosSignInInput & AptosSignInBoundFields;
  };
};

export const loginWithSignInOutputLegacy = async (
  output: Pick<AptosSignInOutput, "type" | "signature" | "account"> & {
    message: string;
  },
) => {
  const response = await fetch(`${BACKEND_URL}/auth/siwa/legacy/callback`, {
    credentials: "include",
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ output: serializeLegacySignInOutput(output) }),
  });
  if (!response.ok) throw new Error("Failed to login with sign in output");
  return (await response.json()) as { data: boolean };
};
