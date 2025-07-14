import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  type MutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { BACKEND_URL } from "@/lib/utils";

export default function useLogout({ ...options }: MutationOptions = {}) {
  const { connected, disconnect } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    retry: 0,
    mutationFn: async () => {
      await fetch(`${BACKEND_URL}/user/logout`, {
        credentials: "include",
        method: "POST",
      });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      if (connected) disconnect();
    },
  });
}
