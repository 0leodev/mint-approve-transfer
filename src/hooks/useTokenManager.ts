import { useEffect, useReducer, useMemo, useCallback } from "react"
import { useAccount } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { ERC20_ABI } from "../config/abi"
import { useTokenReads, useTokenWriter, useTransactionLoading } from "./tokenContractHooks"

interface TokenState {
  balance: string
  approvedAmount: string
  amount: string
  error: string | null
  approveHash?: `0x${string}`
  transferHash?: `0x${string}`
  mintHash?: `0x${string}`
}

type TokenAction =
  | { type: "SET_AMOUNT"; payload: string }
  | { type: "SET_BALANCE"; payload: bigint }
  | { type: "SET_APPROVED_AMOUNT"; payload: bigint }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_HASH"; payload: { kind: "approve" | "transfer" | "mint"; hash?: `0x${string}` } }

const initialState: TokenState = {
  balance: "0",
  approvedAmount: "0",
  amount: "",
  error: null,
}

function tokenReducer(state: TokenState, action: TokenAction): TokenState {
  switch (action.type) {
    case "SET_AMOUNT":
      return { ...state, amount: action.payload }
    case "SET_BALANCE":
      return { ...state, balance: action.payload.toString() }
    case "SET_APPROVED_AMOUNT":
      return { ...state, approvedAmount: action.payload.toString() }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_HASH": {
      const { kind, hash } = action.payload
      if (kind === "approve") return { ...state, approveHash: hash }
      if (kind === "transfer") return { ...state, transferHash: hash }
      return { ...state, mintHash: hash }
    }
    default:
      return state
  }
}

export function useTokenManager(token: { address: string; decimals: number; symbol: string }, targetAddress: string) {
  const { address } = useAccount()
  const [state, dispatch] = useReducer(tokenReducer, initialState)

  const { balance, refetchBalance, allowance, refetchAllowance } = useTokenReads(
    token.address as `0x${string}`,
    address as `0x${string}`,
    address as `0x${string}`
  )

  const { writeContractAsync } = useTokenWriter()

  const { isLoading: isApproveLoading } = useTransactionLoading(state.approveHash)
  const { isLoading: isTransferLoading } = useTransactionLoading(state.transferHash)
  const { isLoading: isMintLoading } = useTransactionLoading(state.mintHash)

  useEffect(() => {
    if (balance !== undefined) dispatch({ type: "SET_BALANCE", payload: balance })
    if (allowance !== undefined) dispatch({ type: "SET_APPROVED_AMOUNT", payload: allowance })
  }, [balance, allowance])

  useEffect(() => {
    const id = setInterval(() => {
      refetchBalance()
      refetchAllowance()
    }, 5000)
    return () => clearInterval(id)
  }, [refetchBalance, refetchAllowance])

  const sendTx = async (kind: "approve" | "transfer" | "mint", executor: () => Promise<`0x${string}`> ) => {
    if (kind !== "mint" && !state.amount) return
    if (kind === "transfer" && !targetAddress) return
    if (!address) return
    dispatch({ type: "SET_ERROR", payload: null })
    try {
      const hash = await executor()
      dispatch({ type: "SET_HASH", payload: { kind, hash } })
    } catch (err) {
      console.error(`${kind} failed:`, err)
      dispatch({ type: "SET_ERROR", payload: `${kind.charAt(0).toUpperCase() + kind.slice(1)} failed. Please try again.` })
    }
  }

  const handleApprove = async () => {
    if (!state.amount || !address) return
    await sendTx("approve", () =>
      writeContractAsync({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [address, parseUnits(state.amount, token.decimals)],
      }) as Promise<`0x${string}`>
    )
  }

  const handleTransfer = async () => {
    if (!targetAddress || !state.amount || !address) return
    await sendTx("transfer", () =>
      writeContractAsync({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transferFrom",
        args: [address, targetAddress as `0x${string}`, parseUnits(state.amount, token.decimals)],
      }) as Promise<`0x${string}`>
    )
  }

  const handleMint = async () => {
    if (!address) return
    await sendTx("mint", () =>
      writeContractAsync({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address, parseUnits("100", token.decimals)],
      }) as Promise<`0x${string}`>
    )
  }

  const fmt = useCallback((s: string) => formatUnits(BigInt(s), token.decimals), [token.decimals])

  const formattedBalance = useMemo(() => fmt(state.balance), [state.balance, fmt])
  const formattedApprovedAmount = useMemo(() => fmt(state.approvedAmount), [state.approvedAmount, fmt])

  const hasInsufficientBalance = useMemo(() => Number.parseFloat(state.amount) > Number.parseFloat(formattedBalance), [state.amount, formattedBalance])
  const hasInsufficientAllowance = useMemo(() => Number.parseFloat(state.amount) > Number.parseFloat(formattedApprovedAmount), [state.amount, formattedApprovedAmount])

  return {
    balance: formattedBalance,
    approvedAmount: formattedApprovedAmount,
    amount: state.amount,
    error: state.error,
    setAmount: (amount: string) => dispatch({ type: "SET_AMOUNT", payload: amount }),
    handleApprove,
    handleTransfer,
    handleMint,
    isApproveLoading,
    isTransferLoading,
    isMintLoading,
    hasInsufficientBalance,
    hasInsufficientAllowance,
  }
}

