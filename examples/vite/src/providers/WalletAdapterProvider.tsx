import {
  AptosWalletAdapterProvider,
  Wallet,
  WalletCore,
} from "@aptos-labs/wallet-adapter-react";
import { PropsWithChildren, useCallback } from "react";
import { fetchSignInInput, loginWithSignInOutput } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { fetchUser } from "@/hooks/useUser";
import { toast } from "sonner";

export default function WalletAdapterProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();

  const autoConnect = useCallback(async (core: WalletCore, wallet: Wallet) => {
    // If the user is already logged in, the user does not need to sign a message.
    // They can proceed with a normal connect flow.
    if (!wallet.signIn || (await fetchUser()) !== null) return true;

    const input = await fetchSignInInput();

    const output = await core.signIn(wallet.name, input.data);

    if (typeof output !== "object")
      throw new Error("An issue occurred while signing in.");

    await loginWithSignInOutput(output);

    await queryClient.invalidateQueries({ queryKey: ["user"] });

    return false;
  }, []);

  return (
    <AptosWalletAdapterProvider
      onError={(error) => toast.error(error)}
      autoConnect={autoConnect}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
