import { BACKEND_URL } from "@/lib/utils";
import {
  AptosSignInInput,
  AptosSignInOutput,
} from "@aptos-labs/wallet-adapter-react";

export const fetchSignInInput = async () => {
  const response = await fetch(`${BACKEND_URL}/auth/siwa`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch sign in input");
  return (await response.json()) as { data: AptosSignInInput };
};

export const fetchSignInErrorInput = async () => {
  const response = await fetch(`${BACKEND_URL}/auth/siwa/error`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch sign in input");
  return (await response.json()) as { data: AptosSignInInput };
};

export const loginWithSignInOutput = async (output: AptosSignInOutput) => {
  const response = await fetch(`${BACKEND_URL}/auth/siwa/callback`, {
    credentials: "include",
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      type: output.type,
      signature: output.signature.bcsToHex().toString(),
      message: output.plainText,
      publicKey: output.account.publicKey.bcsToHex().toString(),
    }),
  });
  if (!response.ok) throw new Error("Failed to login with sign in output");
  return (await response.json()) as { data: boolean };
};
