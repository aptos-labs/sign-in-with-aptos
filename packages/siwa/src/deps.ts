export const tryImportDerivedWalletSolana = async () => {
  try {
    return await import(
      /* webpackIgnore: true */ /* @vite-ignore */ "@aptos-labs/derived-wallet-solana"
    );
  } catch {
    return null;
  }
};

export const tryImportDerivedWalletEthereum = async () => {
  try {
    return await import(
      /* webpackIgnore: true */ /* @vite-ignore */ "@aptos-labs/derived-wallet-ethereum"
    );
  } catch {
    return null;
  }
};
