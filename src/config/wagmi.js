import { http, createConfig } from "wagmi";
import { baseSepolia } from "viem/chains";
import { injected, metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  reconnectOnMount: false,
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});
