import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { ERC20_ABI } from "../config/abi"

export function useTokenReads(tokenAddress: `0x${string}`, account?: `0x${string}`, spender?: `0x${string}`) {
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account!],
    query: { enabled: !!account },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account!, spender!],
    query: { enabled: !!account && !!spender },
  })

  return { balance, refetchBalance, allowance, refetchAllowance }
}

export function useTokenWriter() {
  const { writeContractAsync } = useWriteContract()
  return { writeContractAsync }
}

export function useTransactionLoading(hash?: `0x${string}`) {
  const { isLoading } = useWaitForTransactionReceipt({ hash })
  return { isLoading }
}
