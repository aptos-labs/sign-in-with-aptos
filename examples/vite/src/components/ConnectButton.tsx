import { truncateAddress, useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import useLogout from "@/hooks/useLogout";
import { useUser } from "@/hooks/useUser";
import {
  fetchSignInErrorInput,
  fetchSignInInput,
  loginWithSignInOutput,
} from "@/lib/auth";

interface ConnectButtonProps extends ButtonProps {
  siwaVariant?: "default" | "error";
  walletName?: string;
}

export default function ConnectButton({
  siwaVariant = "default",
  walletName = "Petra",
  ...props
}: ConnectButtonProps) {
  const { user, isLoggedIn } = useUser();
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const { signIn, disconnect } = useWallet();

  const { mutate: login } = useMutation({
    mutationFn: async () => {
      const input = await (siwaVariant === "default"
        ? fetchSignInInput()
        : fetchSignInErrorInput());

      const output = await signIn({ walletName, input: input.data });

      if (typeof output !== "object")
        throw new Error("An issue occurred while signing in.");

      try {
        await loginWithSignInOutput(output);
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
    },
  });

  return (
    <Button
      onClick={isLoggedIn ? () => logout() : () => login()}
      className={isLoggedIn ? "tracking-wider" : ""}
      {...props}
    >
      {isLoggedIn && user
        ? truncateAddress(user.address.toString())
        : "Sign In with Petra"}
    </Button>
  );
}
