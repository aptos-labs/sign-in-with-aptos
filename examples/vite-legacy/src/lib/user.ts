import { BACKEND_URL } from "./utils";

export const saveProfile = async (name?: string, favoriteColor?: string) => {
  const response = await fetch(`${BACKEND_URL}/user`, {
    credentials: "include",
    method: "PUT",
    headers: new Headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, favoriteColor }),
  });
  if (!response.ok) throw new Error("Failed to save profile");
  return (await response.json()) as { data: boolean };
};
