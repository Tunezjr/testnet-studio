export const ZENITH = {
  chainId: 936485,
  chainIdHex: "0xe4a25",
  name: "Zenith EVM Testnet",
  rpc: "https://rpc.testnet.zenith.network/",
  explorer: "https://explorer.testnet.zenith.network",
  faucet: "https://explorer.testnet.zenith.network/faucet",
  symbol: "ZTH",
  decimals: 18,
};

export function txUrl(hash) {
  return `${ZENITH.explorer}/tx/${hash}`;
}

export function addressUrl(addr) {
  return `${ZENITH.explorer}/address/${addr}`;
}

export async function ensureZenith(provider) {
  const current = await provider.request({ method: "eth_chainId" });
  if (current?.toLowerCase() === ZENITH.chainIdHex) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ZENITH.chainIdHex }],
    });
  } catch (err) {
    if (err?.code === 4902 || String(err?.message || "").includes("Unrecognized")) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ZENITH.chainIdHex,
            chainName: ZENITH.name,
            nativeCurrency: {
              name: "Zenith token",
              symbol: ZENITH.symbol,
              decimals: ZENITH.decimals,
            },
            rpcUrls: [ZENITH.rpc],
            blockExplorerUrls: [ZENITH.explorer],
          },
        ],
      });
      return;
    }
    throw err;
  }
}
