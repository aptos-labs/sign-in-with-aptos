import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const testMainnet = new Aptos(
  new AptosConfig({
    network: Network.MAINNET,
    clientConfig: { API_KEY: process.env.APTOS_MAINNET_API_KEY },
  }),
);
