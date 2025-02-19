import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative mx-auto container">
      <div className="border border-b-0 border-border relative text-center py-16">
        <p className="max-w-3xl mx-auto text-3xl bg-background leading-normal">
          Build with{" "}
          <AuroraText className="font-semibold">Sign in with Aptos</AuroraText>
        </p>

        <br />

        <Button className="w-fit" asChild>
          <Link href="/docs">Get Started</Link>
        </Button>
      </div>
    </section>
  );
}
