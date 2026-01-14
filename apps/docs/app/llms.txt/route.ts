import { NextResponse } from "next/server";
import { generateLlmsTxt } from "@/lib/llms";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://siwa.aptos.dev";

export async function GET() {
  const content = generateLlmsTxt(BASE_URL);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
