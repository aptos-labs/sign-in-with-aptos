import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export const ed25519Account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(
    "ed25519-priv-0x7f8f21eadca4a5d29591dc55582cca1b7263e9ff150b577a9d8c423ecd857631"
  ),
});
