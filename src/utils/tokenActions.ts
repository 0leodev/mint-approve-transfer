import { parseUnits } from "viem";
import { ERC20_ABI } from "../config/abi";
import type { TokenState, TokenAction } from "../hooks/tokenReducer";
import { sendTx } from "./sendTx";

export type WriteContractFn = (...a: unknown[]) => Promise<`0x${string}`>;

export function makeTokenHandlers(opts: {
  state: TokenState;
  dispatch: (a: TokenAction) => void;
  writeContractAsync: unknown;
  token: { address: string; decimals: number; symbol: string };
  address?: `0x${string}`;
  targetAddress?: string;
}) {
  const { state, dispatch, writeContractAsync, token, address, targetAddress } =
    opts;
  const exec = (fn: string, args: unknown[]) => () =>
    (writeContractAsync as WriteContractFn)({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: fn,
      args,
    }) as Promise<`0x${string}`>;
  return {
    handleApprove: async () =>
      sendTx({
        kind: "approve",
        state,
        dispatch,
        address,
        targetAddress,
        executor: exec("approve", [
          address,
          parseUnits(state.amount, token.decimals),
        ]),
      }),
    handleTransfer: async () =>
      sendTx({
        kind: "transfer",
        state,
        dispatch,
        address,
        targetAddress,
        executor: exec("transferFrom", [
          address,
          targetAddress as `0x${string}`,
          parseUnits(state.amount, token.decimals),
        ]),
      }),
    handleMint: async () =>
      sendTx({
        kind: "mint",
        state,
        dispatch,
        address,
        targetAddress,
        executor: exec("mint", [address, parseUnits("100", token.decimals)]),
      }),
  };
}
