import { useEffect } from "react";

export function useTokenPolling(
  refetchBalance: () => void,
  refetchAllowance: () => void
) {
  useEffect(() => {
    const id = setInterval(() => {
      refetchBalance();
      refetchAllowance();
    }, 5000);
    return () => clearInterval(id);
  }, [refetchBalance, refetchAllowance]);
}
