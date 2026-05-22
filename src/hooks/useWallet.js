import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useSwitchChain, useBalance } from "wagmi";
import { MUSD_ABI, MUSD_ADDRESS as FALLBACK_MUSD } from "../config/contracts.js";
import { UGFClient, TYI_USD_PAYMENT_COIN } from "@tychilabs/ugf-testnet-js";

let pendingDeduction = 0;
const deductionListeners = new Set();

export const recordPendingDeduction = (amount) => {
  pendingDeduction += Number(amount);
  deductionListeners.forEach(fn => fn());
};

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  const [optDeduct, setOptDeduct] = useState(pendingDeduction);
  useEffect(() => {
    const handleDeduction = () => setOptDeduct(pendingDeduction);
    deductionListeners.add(handleDeduction);
    return () => deductionListeners.delete(handleDeduction);
  }, []);

  const isCorrectChain = chainId === 84532; // Base Sepolia
  
  // Format helpers
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const { data: ethBalanceData } = useBalance({
    address,
    query: {
      refetchInterval: 4000,
    }
  });
  const ethBalanceFormatted = ethBalanceData ? Number(ethBalanceData.formatted).toFixed(3) : "0.000";

  // Action helpers
  const switchToSepolia = useCallback(() => {
    switchChain({ chainId: 84532 });
  }, [switchChain]);
  
  // Use the official UGF Mock USD Address directly to avoid rate limits
  const musdAddress = "0x27DC1C167AeF232bb1e21073304B526726a8727e";

  // Use wagmi to read the MUSD balance of the connected wallet
  const {
    data: musdBalanceData,
    refetch: refetchBalance,
  } = useReadContract({
    address: musdAddress,
    abi: MUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!musdAddress,
      refetchInterval: 4000, // Poll balance every 4 seconds to capture background transactions
    },
  });

  const {
    writeContract: callFaucet,
    data: faucetTxHash,
  } = useWriteContract();

  const handleFaucet = useCallback(() => {
    if (!musdAddress) return;
    callFaucet({
      address: musdAddress,
      abi: MUSD_ABI,
      functionName: "faucet",
    });
  }, [callFaucet, musdAddress]);

  let musdBalance = null;
  if (musdBalanceData !== undefined) {
    // formatting wei to readable string (TYI_MOCK_USD uses 6 decimals)
    const formatted = Number(musdBalanceData) / 10 ** 6;
    const finalBalance = Math.max(0, formatted - optDeduct);
    musdBalance = finalBalance.toFixed(2);
  }

  // Claim check for NFT
  // Since we don't have the original useWallet code, I'll mock hasClaimed to false
  // or return a standard state if they haven't claimed it.
  const hasClaimed = false;
  const refetchClaimed = () => {};

  return {
    address,
    shortAddress,
    isConnected,
    chainId,
    isCorrectChain,
    switchChain,
    switchToSepolia,
    isSwitching,
    ethBalanceFormatted,
    musdBalance,
    refetchBalance,
    handleFaucet,
    faucetTxHash,
    musdAddress,
    hasClaimed,
    refetchClaimed,
  };
}
