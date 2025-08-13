import { sepolia } from "wagmi/chains"

export const SUPPORTED_CHAIN = sepolia

export const TOKENS = {
  DAI: {
    address: "0x1D70D57ccD2798323232B2dD027B3aBcA5C00091",
    decimals: 18,
    symbol: "DAI",
  },
  USDC: {
    address: "0xC891481A0AaC630F4D89744ccD2C7D2C4215FD47",
    decimals: 6,
    symbol: "USDC",
  },
} as const

