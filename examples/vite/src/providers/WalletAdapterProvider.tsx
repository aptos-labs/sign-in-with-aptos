import { fetchUser } from "@/hooks/useUser";
import { fetchSignInInput, loginWithSignInOutput } from "@/lib/auth";
import {
  type AdapterWallet,
  AptosWalletAdapterProvider,
  type WalletCore,
} from "@aptos-labs/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { type PropsWithChildren, useCallback } from "react";
import { toast } from "sonner";

export default function WalletAdapterProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();

  const autoConnect = useCallback(
    async (core: WalletCore, adapter: AdapterWallet) => {
      // If the user is already logged in, the user does not need to sign a message.
      // They can proceed with a normal connect flow.
      if (!adapter.features["aptos:signIn"] || (await fetchUser()) !== null) {
        return true;
      }

      const input = await fetchSignInInput();

      const output = await core.signIn({
        walletName: adapter.name,
        input: input.data,
      });

      if (typeof output !== "object")
        throw new Error("An issue occurred while signing in.");

      await loginWithSignInOutput(output);

      await queryClient.invalidateQueries({ queryKey: ["user"] });

      return false;
    },
    [queryClient],
  );

  return (
    <AptosWalletAdapterProvider
      onError={(error) => toast.error(error)}
      autoConnect={autoConnect}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
