import { useEffect, useReducer, useMemo } from "react";
import { useAccount } from "wagmi";

import {
  useTokenReads,
  useTokenWriter,
  useTransactionLoading,
} from "./token/tokenContractHooks";
import { tokenReducer, initialState } from "./token/tokenReducer";
import { makeTokenHandlers } from "../utils/tokenActions";
import { fmt as fmtFn } from "../utils/format";
import { useTokenPolling } from "./token/useTokenPolling";

export function useTokenManager(
  token: { address: string; decimals: number; symbol: string },
  targetAddress: string
) {
  const { address } = useAccount();
  const [state, dispatch] = useReducer(tokenReducer, initialState);

  const { balance, refetchBalance, allowance, refetchAllowance } =
    useTokenReads(
      token.address as `0x${string}`,
      address as `0x${string}`,
      address as `0x${string}`
    );

  const { writeContractAsync } = useTokenWriter();

  const { isLoading: isApproveLoading } = useTransactionLoading(
    state.approveHash
  );
  const { isLoading: isTransferLoading } = useTransactionLoading(
    state.transferHash
  );
  const { isLoading: isMintLoading } = useTransactionLoading(state.mintHash);

  useEffect(() => {
    if (balance !== undefined)
      dispatch({ type: "SET_BALANCE", payload: balance });
    if (allowance !== undefined)
      dispatch({ type: "SET_APPROVED_AMOUNT", payload: allowance });
  }, [balance, allowance]);

  useTokenPolling(refetchBalance, refetchAllowance);

  const handlers = makeTokenHandlers({
    state,
    dispatch,
    writeContractAsync,
    token,
    address: address as `0x${string}` | undefined,
    targetAddress,
  });

  const formattedBalance = useMemo(
    () => fmtFn(state.balance, token.decimals),
    [state.balance, token.decimals]
  );
  const formattedApprovedAmount = useMemo(
    () => fmtFn(state.approvedAmount, token.decimals),
    [state.approvedAmount, token.decimals]
  );

  const hasInsufficientBalance = useMemo(
    () => Number.parseFloat(state.amount) > Number.parseFloat(formattedBalance),
    [state.amount, formattedBalance]
  );
  const hasInsufficientAllowance = useMemo(
    () =>
      Number.parseFloat(state.amount) >
      Number.parseFloat(formattedApprovedAmount),
    [state.amount, formattedApprovedAmount]
  );

  return {
    balance: formattedBalance,
    approvedAmount: formattedApprovedAmount,
    amount: state.amount,
    error: state.error,
    setAmount: (amount: string) =>
      dispatch({ type: "SET_AMOUNT", payload: amount }),
    handleApprove: handlers.handleApprove,
    handleTransfer: handlers.handleTransfer,
    handleMint: handlers.handleMint,
    isApproveLoading,
    isTransferLoading,
    isMintLoading,
    hasInsufficientBalance,
    hasInsufficientAllowance,
  };
}
