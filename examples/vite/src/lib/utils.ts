import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
