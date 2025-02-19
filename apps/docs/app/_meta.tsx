import type { MetaRecord } from "nextra";

export default {
  index: {
    type: "page",
    display: "hidden",
  },
  docs: {
    title: "Documentation",
    type: "page",
  },
} satisfies MetaRecord;
