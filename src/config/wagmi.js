import { http, createConfig } from "wagmi";
import { baseSepolia } from "viem/chains";
import { injected, metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  reconnectOnMount: false,
  connectors: [
    injected(), // Default browser wallet
    coinbaseWallet({ appName: 'Universal Gas Framework Hackathon' }),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "e228ceee5fb2206716dc19eb38c645b2",
      showQrModal: true, // Native modal for hundreds of wallets
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});
