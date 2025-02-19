"use client";

import ExpandingContainer from "@/components/ExpandingContainer";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { CodeOption } from "./Code";

interface CodeExamplesProps {
  options: CodeOption[];
}

export default function CodeExamples({ options }: CodeExamplesProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  return (
    <div className="border-x border-border border-t">
      <div className="p-4 px-8 flex space-x-2 overflow-x-auto">
        {options.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={`flex-shrink-0 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-all ${
              selectedIndex === index
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <ExpandingContainer
        className="border-t border-border"
        initialHeight={554}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${options.at(selectedIndex)?.title}-description`}
            initial={{ opacity: 0, translateX: -10, filter: "blur(8px)" }}
            animate={{ opacity: 1, translateX: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, translateX: 10, filter: "blur(8px)" }}
            transition={{ duration: 0.2 }}
            className="p-4 px-8"
          >
            {options.at(selectedIndex)?.description}
          </motion.div>
        </AnimatePresence>
        <div className="border-t border-border" />
        <div className="bg-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${options.at(selectedIndex)?.title}-code`}
              initial={{ opacity: 0, translateX: -10, filter: "blur(8px)" }}
              animate={{ opacity: 1, translateX: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, translateX: 10, filter: "blur(8px)" }}
              transition={{ duration: 0.25 }}
              className=" font-mono text-sm bg-card [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:px-8 [&_code]:break-all md:max-h-[50vh] overflow-scroll"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
              dangerouslySetInnerHTML={{
                __html: options.at(selectedIndex)?.code ?? "",
              }}
            />
          </AnimatePresence>
        </div>
      </ExpandingContainer>
    </div>
  );
}
