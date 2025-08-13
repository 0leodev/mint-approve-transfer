import { useEffect, useReducer, useMemo } from "react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { ERC20_ABI } from "../config/abi"

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
  | { type: "SET_APPROVE_HASH"; payload: `0x${string}` | undefined }
  | { type: "SET_TRANSFER_HASH"; payload: `0x${string}` | undefined }
  | { type: "SET_MINT_HASH"; payload: `0x${string}` | undefined }

const initialState: TokenState = {
  balance: "0",
  approvedAmount: "0",
  amount: "",
  error: null,
  approveHash: undefined,
  transferHash: undefined,
  mintHash: undefined,
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
    case "SET_APPROVE_HASH":
      return { ...state, approveHash: action.payload }
    case "SET_TRANSFER_HASH":
      return { ...state, transferHash: action.payload }
    case "SET_MINT_HASH":
      return { ...state, mintHash: action.payload }
    default:
      return state
  }
}

export function useTokenManager(token: { address: string; decimals: number; symbol: string }, targetAddress: string) {
  const { address } = useAccount()
  const [state, dispatch] = useReducer(tokenReducer, initialState)

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address!, address!],
    query: {
      enabled: !!address,
    },
  })

  const { writeContractAsync } = useWriteContract()

  const { isLoading: isApproveLoading } = useWaitForTransactionReceipt({
    hash: state.approveHash,
  })

  const { isLoading: isTransferLoading } = useWaitForTransactionReceipt({
    hash: state.transferHash,
  })

  const { isLoading: isMintLoading } = useWaitForTransactionReceipt({
    hash: state.mintHash,
  })

  useEffect(() => {
    if (balance !== undefined) {
      dispatch({ type: "SET_BALANCE", payload: balance })
    }
  }, [balance])

  useEffect(() => {
    if (allowance !== undefined) {
      dispatch({ type: "SET_APPROVED_AMOUNT", payload: allowance })
    }
  }, [allowance])

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchBalance()
      refetchAllowance()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [refetchBalance, refetchAllowance])

  const handleApprove = async () => {
    if (!state.amount || !address) return
    dispatch({ type: "SET_ERROR", payload: null })
    try {
      const hash = await writeContractAsync({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [address, parseUnits(state.amount, token.decimals)],
      })
      dispatch({ type: "SET_APPROVE_HASH", payload: hash })
    } catch (error) {
      console.error("Approve failed:", error)
      dispatch({ type: "SET_ERROR", payload: "Approval failed. Please try again." })
    }
  }

  const handleTransfer = async () => {
    if (!targetAddress || !state.amount || !address) return
    dispatch({ type: "SET_ERROR", payload: null })
    try {
      const hash = await writeContractAsync({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transferFrom",
        args: [address, targetAddress as `0x${string}`, parseUnits(state.amount, token.decimals)],
      })
      dispatch({ type: "SET_TRANSFER_HASH", payload: hash })
    } catch (error) {
      console.error("Transfer failed:", error)
      dispatch({ type: "SET_ERROR", payload: "Transfer failed. Please try again." })
    }
  }

  const handleMint = async () => {
    if (!address) return
    dispatch({ type: "SET_ERROR", payload: null })
    try {
      const hash = await writeContractAsync({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address, parseUnits("100", token.decimals)],
      })
      dispatch({ type: "SET_MINT_HASH", payload: hash })
    } catch (error) {
      console.error("Mint failed:", error)
      dispatch({ type: "SET_ERROR", payload: "Minting failed. Please try again." })
    }
  }

  const formattedBalance = useMemo(() => {
    return formatUnits(BigInt(state.balance), token.decimals)
  }, [state.balance, token.decimals])

  const formattedApprovedAmount = useMemo(() => {
    return formatUnits(BigInt(state.approvedAmount), token.decimals)
  }, [state.approvedAmount, token.decimals])

  const hasInsufficientBalance = useMemo(() => {
    return Number.parseFloat(state.amount) > Number.parseFloat(formattedBalance)
  }, [state.amount, formattedBalance])

  const hasInsufficientAllowance = useMemo(() => {
    return Number.parseFloat(state.amount) > Number.parseFloat(formattedApprovedAmount)
  }, [state.amount, formattedApprovedAmount])

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

