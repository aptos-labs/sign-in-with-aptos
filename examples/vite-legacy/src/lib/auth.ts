import { BACKEND_URL } from "@/lib/utils";
import { serializeSignInOutput } from "@aptos-labs/siwa";
import type {
  AptosSignInInput,
  AptosSignInOutput,
  AptosSignInRequiredFields,
} from "@aptos-labs/wallet-adapter-react";

export const fetchSignInInputLegacy = async (address: string) => {
  const response = await fetch(
    `${BACKEND_URL}/auth/legacy/siwa?address=${address}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Failed to fetch sign in input");
  return (await response.json()) as {
    data: AptosSignInInput & AptosSignInRequiredFields;
  };
};

export const loginWithSignInOutputLegacy = async (
  output: Pick<
    AptosSignInOutput,
    "type" | "signature" | "plainText" | "account"
  >,
) => {
  const response = await fetch(`${BACKEND_URL}/auth/siwa/legacy/callback`, {
    credentials: "include",
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ output: serializeSignInOutput(output) }),
  });
  if (!response.ok) throw new Error("Failed to login with sign in output");
  return (await response.json()) as { data: boolean };
};
