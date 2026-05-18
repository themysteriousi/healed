import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./config/wagmi.js";
import SplitScreenDemo from "./SplitScreenDemo.jsx";
import "./index.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SplitScreenDemo />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
