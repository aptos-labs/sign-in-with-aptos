import type { MetaRecord } from "nextra";

export default {
  "--": {
    type: "separator",
    title: "Overview",
  },
  index: "Introduction",
  aip: {
    title: "AIP-116",
    href: "https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-116.md",
  },
  "---": {
    type: "separator",
    title: "Typescript",
  },
  "ts-aptos-labs-siwa": "@aptos-labs/siwa",
  "ts-aptos-labs-wallet-adapter-react": "@aptos-labs/wallet-adapter-react",
  "----": {
    type: "separator",
    title: "Support",
  },
  "wallet-integrations": "Wallet Integrations",
} satisfies MetaRecord;
