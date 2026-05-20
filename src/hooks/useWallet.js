import { useAccount, useChainId, useSwitchChain, useReadContract, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { MUSD_ADDRESS, MUSD_ABI, BADGE_NFT_ADDRESS, BADGE_NFT_ABI } from "../config/contracts.js";

/**
 * Central wallet state hook – provides connection status, chain validation,
 * on-chain MUSD balance, and whether the user already holds a badge.
 */
export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isCorrectChain = chainId === sepolia.id;
  const enabled = !!address && isCorrectChain;

  // ETH balance (will likely be 0 – that's the point!)
  const { data: ethBalance } = useBalance({ address, query: { enabled: !!address } });

  // MUSD balance from MockUSD contract
  const { data: musdRaw, refetch: refetchBalance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled },
  });

  // Whether this wallet has already minted a badge
  const { data: hasClaimed, refetch: refetchClaimed } = useReadContract({
    address: BADGE_NFT_ADDRESS,
    abi: BADGE_NFT_ABI,
    functionName: "hasClaimed",
    args: [address],
    query: { enabled },
  });

  const switchToSepolia = () => switchChain({ chainId: sepolia.id });

  const musdBalance = musdRaw !== undefined ? formatUnits(musdRaw, 18) : null;
  const ethBalanceFormatted = ethBalance ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4) : "0.0000";

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return {
    address,
    shortAddress,
    isConnected,
    chainId,
    isCorrectChain,
    isSwitching,
    ethBalanceFormatted,
    musdBalance,
    hasClaimed: hasClaimed ?? false,
    switchToSepolia,
    refetchBalance,
    refetchClaimed,
  };
}
