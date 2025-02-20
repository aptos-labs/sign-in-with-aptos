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
        <h1>
          <AuroraText className="font-semibold tracking-tighter text-5xl md:text-6xl">
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
              wordLevelClassName="last:pr-2"
              containerClassName="leading-normal"
            >
              {"Sign in with Aptos"}
            </VerticalCutReveal>
          </AuroraText>
        </h1>
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
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            duration: 0.4,
            type: "spring",
            stiffness: 190,
            damping: 22,
          }}
        >
          <Button asChild>
            <Link href="/docs">Get Started</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
