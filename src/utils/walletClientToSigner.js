import { BrowserProvider } from "ethers";

/**
 * Converts a wagmi WalletClient (viem) into an ethers.js Signer.
 * Use this instead of `new BrowserProvider(window.ethereum)` so the code
 * works with any wagmi connector — MetaMask, WalletConnect, Coinbase, etc.
 *
 * @param {import("viem").WalletClient} walletClient — from useWalletClient()
 * @returns {Promise<import("ethers").Signer>}
 */
export async function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;

  const provider = new BrowserProvider(transport, {
    chainId: chain.id,
    name: chain.name,
  });

  return provider.getSigner(account.address);
}
