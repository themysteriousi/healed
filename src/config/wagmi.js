import { http, createConfig } from "wagmi";
import { baseSepolia } from "viem/chains";
import { injected, metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
    ),
  },
});
