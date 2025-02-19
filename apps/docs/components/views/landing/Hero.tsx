"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";
import VerticalCutReveal from "@/components/ui/vertical-cut-reveal";
import { motion } from "motion/react";
import Link from "next/link";

export default function Hero() {
  return (
    <section>
      <div className="flex flex-col items-center w-full py-24 border-x border-border overflow-hidden">
        <AuroraText className="pr-1 font-semibold tracking-tighter text-5xl md:text-6xl">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.1}
            staggerFrom="first"
            reverse={true}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 30,
            }}
            containerClassName="leading-normal"
          >
            Sign in with Aptos
          </VerticalCutReveal>
        </AuroraText>
        <VerticalCutReveal
          splitBy="words"
          staggerDuration={0.1}
          staggerFrom="first"
          transition={{ type: "spring", stiffness: 250, damping: 30 }}
          containerClassName="md:text-lg"
        >
          Authenticate to applications using your Aptos account.
        </VerticalCutReveal>

        <br />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        >
          <Button asChild>
            <Link href="/docs">Get Started</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
