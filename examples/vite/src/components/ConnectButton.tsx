import { Button, ButtonProps } from "@/components/ui/button";
import useLogout from "@/hooks/useLogout";
import { useUser } from "@/hooks/useUser";
import {
  fetchSignInErrorInput,
  fetchSignInInput,
  loginWithSignInOutput,
} from "@/lib/auth";
import { truncateAddress, useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ConnectButtonProps extends ButtonProps {
  siwaVariant?: "default" | "error";
}

export default function ConnectButton({
  siwaVariant = "default",
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

      const output = await signIn("Petra" as any, input.data);

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
