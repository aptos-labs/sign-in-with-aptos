type DerivedWalletSolanaModule =
  typeof import("@aptos-labs/derived-wallet-solana");
type DerivedWalletEthereumModule =
  typeof import("@aptos-labs/derived-wallet-ethereum");

export const tryImportDerivedWalletSolana =
  async (): Promise<DerivedWalletSolanaModule | null> => {
    try {
      return await import(
        /* webpackIgnore: true */ /* @vite-ignore */ "@aptos-labs/derived-wallet-solana"
      );
    } catch {
      return null;
    }
  };

export const tryImportDerivedWalletEthereum =
  async (): Promise<DerivedWalletEthereumModule | null> => {
    try {
      return await import(
        /* webpackIgnore: true */ /* @vite-ignore */ "@aptos-labs/derived-wallet-ethereum"
      );
    } catch {
      return null;
    }
  };
