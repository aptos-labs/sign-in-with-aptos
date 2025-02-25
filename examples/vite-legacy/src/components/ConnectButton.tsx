import { Button, type ButtonProps } from "@/components/ui/button";
import useLogout from "@/hooks/useLogout";
import { useUser } from "@/hooks/useUser";
import {
  fetchSignInInputLegacy,
  loginWithSignInOutputLegacy,
} from "@/lib/auth";
import { truncateAddress, useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createLegacySignInMessage } from "@aptos-labs/siwa/legacy";
import { getSignInPublicKeyScheme } from "@aptos-labs/siwa";

interface ConnectButtonProps extends ButtonProps {}

export default function ConnectButton({ ...props }: ConnectButtonProps) {
  const { user, isConnected, isAuthenticated } = useUser();
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const { signMessage, disconnect, connect, account } = useWallet();

  console.log(account?.publicKey);

  const { mutate: signMessageAndLogin } = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("User not found");

      const input = await fetchSignInInputLegacy(account.address.toString());

      const output = await signMessage({
        message: createLegacySignInMessage(input.data),
        nonce: "N/A",
      });

      if (typeof output !== "object")
        throw new Error("An issue occurred while signing in.");

      try {
        await loginWithSignInOutputLegacy({
          account: account,
          plainText: output.fullMessage,
          signature: output.signature,
          type: getSignInPublicKeyScheme(account.publicKey),
        });
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } catch (error) {
        // If there was an issue signing in, disconnect the wallet.
        disconnect();
        throw error;
      }
    },
    onError: (err) => {
      if (err.message.includes("Failed to fetch")) {
        toast.error("Please make sure that the backend is running.");
      }
      toast.error(err.message);
    },
  });

  return (
    <Button
      onClick={
        isAuthenticated
          ? () => logout()
          : isConnected
            ? () => signMessageAndLogin()
            : () => connect("Petra")
      }
      className={isAuthenticated ? "tracking-wider" : ""}
      {...props}
    >
      {isAuthenticated && user
        ? truncateAddress(user.address.toString())
        : isConnected
          ? "Sign Message"
          : "Connect with Petra"}
    </Button>
  );
}
