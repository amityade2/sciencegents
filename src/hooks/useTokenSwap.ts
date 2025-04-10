import { useState, useEffect } from 'react';
import { useTokenBalances } from './swap/useTokenBalances';
import { useSwapCalculations } from './swap/useSwapCalculations';
import { useSwapTransactions } from './swap/useSwapTransactions';
import { toast } from '@/components/ui/use-toast';

// Define the type for swap direction
export type SwapDirection = 'buy' | 'sell';

// Main hook that combines all token swap functionality
export const useTokenSwap = (tokenAddress: string) => {
  // Use the smaller, focused hooks
  const { 
    tokenBalance, 
    ethBalance, 
    tokenPrice,
    ethReserve,
    tokenReserve,
    refreshBalances,
    isPending: isBalanceLoading 
  } = useTokenBalances(tokenAddress);
  
  const { 
    estimateTokensFromETH, 
    estimateETHFromTokens 
  } = useSwapCalculations(tokenAddress);
  
  const { 
    buyTokens, 
    sellTokens, 
    isPending: isTransactionPending, 
    error: transactionError
  } = useSwapTransactions(tokenAddress, refreshBalances);

  // We'll track and filter the error state here
  const [error, setError] = useState<string | null>(null);
  
  // Update our filtered error whenever the transaction error changes
  useEffect(() => {
    // Filter out decimal place errors that don't affect the transaction
    if (transactionError && 
        !transactionError.includes('decimal places') && 
        !transactionError.includes('NUMERIC_FAULT')) {
      setError(transactionError);
    } else {
      setError(null);
    }
  }, [transactionError]);
  
  // Safe estimation with error handling for large numbers
  const safeEstimateTokensFromETH = async (ethAmount: string): Promise<string> => {
    try {
      if (!ethAmount || parseFloat(ethAmount) <= 0) return '0';
      return await estimateTokensFromETH(ethAmount);
    } catch (err) {
      console.error('Error in token estimation:', err);
      return '0';
    }
  };

  // Safe estimation with error handling for large numbers
  const safeEstimateETHFromTokens = async (tokenAmount: string): Promise<string> => {
    try {
      if (!tokenAmount || parseFloat(tokenAmount) <= 0) return '0';
      
      // For very large numbers, we need to be careful
      if (parseFloat(tokenAmount) > 1e15) {
        toast({
          title: "Large Amount Warning",
          description: "Very large token amounts may cause estimation errors",
          variant: "default",
        });
      }
      
      return await estimateETHFromTokens(tokenAmount);
    } catch (err) {
      console.error('Error in ETH estimation:', err);
      return '0';
    }
  };

  // Combine isPending states
  const isPending = isBalanceLoading || isTransactionPending;

  return {
    // Balances
    tokenBalance,
    ethBalance,
    tokenPrice,
    ethReserve,
    tokenReserve,
    refreshBalances,
    
    // Calculations
    estimateTokensFromETH: safeEstimateTokensFromETH,
    estimateETHFromTokens: safeEstimateETHFromTokens,
    
    // Transactions
    buyTokens,
    sellTokens,
    
    // Status
    isPending,
    error
  };
};
