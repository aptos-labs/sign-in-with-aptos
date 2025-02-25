import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import type { PropsWithChildren } from "react";
import { toast } from "sonner";

export default function WalletAdapterProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider
      onError={(error) => toast.error(error)}
      autoConnect
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
