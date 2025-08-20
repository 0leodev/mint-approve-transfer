import { formatUnits } from "viem";

export const fmt = (s: string, decimals: number) =>
  formatUnits(BigInt(s), decimals);