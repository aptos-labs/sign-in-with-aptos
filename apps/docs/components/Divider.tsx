import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

interface DividerProps {
  className?: string;
}

export function Divider({ className }: DividerProps) {
  return (
    <div
      className={cn(
        "flex items-end h-7 border-t border-x border-border",
        className,
      )}
    >
      <div className="h-px w-1/6 border-b border-border" />
      <IconBump className="shrink-0 text-border" />
      <div className="h-px w-full border-b border-border" />
    </div>
  );
}

export function IconBump(props: SVGProps<SVGSVGElement>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg width="24" height="9" viewBox="0 0 24 9" fill="none" {...props}>
      <path
        d="M0 8.5C0.985627 8.5 1.92199 8.12898 2.60207 7.45935L7.99342 2.15654C10.2801 -0.0966995 14.1832 -0.0424036 16.4009 2.26513L21.3389 7.396C22.0091 8.09279 22.9848 8.5 24 8.5"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
    </svg>
  );
}
