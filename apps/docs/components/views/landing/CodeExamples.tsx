"use client";

import ExpandingContainer from "@/components/ExpandingContainer";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "nextra-theme-docs";
import { useState } from "react";
import type { CodeOption } from "./Code";

interface CodeExamplesProps {
  options: CodeOption[];
}

export default function CodeExamples({ options }: CodeExamplesProps) {
  const theme = useTheme();

  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  return (
    <div className="border-x border-border border-t">
      <div className="p-4 px-8 flex space-x-2 overflow-x-auto">
        {options.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`flex-shrink-0 rounded-md px-3 py-1 text-sm font-medium ${
              selectedIndex === index
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <ExpandingContainer debounce={100} className="border-t border-border">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${options.at(selectedIndex)?.title}-description`}
            initial={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: 15 }}
            transition={{ duration: 0.1 }}
            className="p-4 px-8"
          >
            {options.at(selectedIndex)?.description}
          </motion.div>
        </AnimatePresence>
        <div className="border-t border-border" />
        <AnimatePresence mode="wait">
          <motion.div
            key={`${options.at(selectedIndex)?.title}-code`}
            initial={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: 15 }}
            transition={{ duration: 0.1 }}
            className=" font-mono text-sm bg-card [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:px-8 [&_code]:break-all md:max-h-[50vh] overflow-scroll"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{
              __html: options.at(selectedIndex)?.code ?? "",
            }}
          />
        </AnimatePresence>
      </ExpandingContainer>
    </div>
  );
}
