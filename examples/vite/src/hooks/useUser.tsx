import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BACKEND_URL } from "@/lib/utils";
import useLogout from "./useLogout";

export interface GetUserResponse {
  data: { id: string; name: string | null; favoriteColor: string | null };
}

export async function fetchUser() {
  try {
    const response = await fetch(`${BACKEND_URL}/user`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch user");
    return ((await response.json()) as GetUserResponse).data;
  } catch (_) {
    return null;
  }
}

export function useUser() {
  const { account } = useWallet();
  const { mutate: logout } = useLogout();

  const query = useQuery({
    queryKey: ["user"],
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: fetchUser,
  });

  const isLoggedIn = useMemo(
    () => account && query.data && query.data.id === account.address.toString(),
    [account, query.data],
  );

  const user = useMemo(
    () =>
      isLoggedIn && account && query.data
        ? { ...account, ...query.data }
        : undefined,
    [account, query.data, isLoggedIn],
  );

  useQuery({
    queryKey: ["ensure-account", account?.address, query?.data?.id],
    queryFn: async () => {
      if (
        query.data &&
        account &&
        query.data?.id !== account?.address.toString()
      ) {
        logout();
      }
      return null;
    },
  });

  return { ...query, isLoggedIn, data: user, user };
}
