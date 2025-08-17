"use client"

import { Loader2 } from "lucide-react"
import { useTokenManager } from "../hooks/useTokenManager"

interface TokenManagerProps {
  token: {
    address: string
    decimals: number
    symbol: string
  }
  targetAddress: string
}

export function TokenManager({ token, targetAddress }: TokenManagerProps) {
  const {
    balance,
    approvedAmount,
    amount,
    error,
    setAmount,
    handleApprove,
    handleTransfer,
    handleMint,
    isApproveLoading,
    isTransferLoading,
    isMintLoading,
    hasInsufficientBalance,
    hasInsufficientAllowance,
  } = useTokenManager(token, targetAddress)

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:border-gray-600">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{token.symbol}</h2>
        <p className="text-lg font-medium">
          Balance:{" "}
          <span className="text-white-400">{Number.parseFloat(balance).toFixed(2)}</span>
        </p>
      </div>

      <div className="flex-grow">
        <label htmlFor={`amount-${token.symbol}`} className="block mb-2 font-medium">
          Amount:
        </label>
        <input
          id={`amount-${token.symbol}`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-gray-700 border border-gray-600 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          min="0"
        />
        {hasInsufficientBalance && <p className="text-red-500 text-sm mt-1 animate-pulse">Insufficient balance</p>}
        {hasInsufficientAllowance && (
          <p className="text-yellow-500 text-sm mt-1 animate-pulse">Need to approve the amount first</p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-400">
          Approved for spending:{" "}
          <span className="font-medium">{Number.parseFloat(approvedAmount).toFixed(2)}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <button
          onClick={handleApprove}
          disabled={!amount || hasInsufficientBalance || isApproveLoading}
          className="bg-gray-700 hover:bg-gray-900 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-12 flex items-center justify-center"
        >
          {isApproveLoading ? <Loader2 className="animate-spin" /> : "Approve"}
        </button>
        <button
          onClick={handleTransfer}
          disabled={
            !amount || !targetAddress || hasInsufficientBalance || hasInsufficientAllowance || isTransferLoading
          }
          className="bg-gray-700 hover:bg-gray-900 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-12 flex items-center justify-center"
        >
          {isTransferLoading ? <Loader2 className="animate-spin" /> : "Transfer"}
        </button>
        <button
          onClick={handleMint}
          disabled={isMintLoading}
          className="bg-gray-700 hover:bg-gray-900 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-12 flex items-center justify-center"
        >
          {isMintLoading ? <Loader2 className="animate-spin" /> : `Mint 100 ${token.symbol}`}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-600 bg-opacity-25 border border-red-600 rounded-xl text-red-100 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
