import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
