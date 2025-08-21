import type { TokenState, TokenAction } from "../hooks/token/tokenReducer";

export async function sendTx(params: {
  kind: "approve" | "transfer" | "mint";
  state: TokenState;
  dispatch: (a: TokenAction) => void;
  address?: `0x${string}`;
  targetAddress?: string;
  executor: () => Promise<`0x${string}`>;
}) {
  const { kind, state, dispatch, address, targetAddress, executor } = params;
  if (kind !== "mint" && !state.amount) return;
  if (kind === "transfer" && !targetAddress) return;
  if (!address) return;
  dispatch({ type: "SET_ERROR", payload: null });
  try {
    const hash = await executor();
    dispatch({ type: "SET_HASH", payload: { kind, hash } });
  } catch (err) {
    console.error(`${kind} failed:`, err);
    dispatch({
      type: "SET_ERROR",
      payload: `${
        kind.charAt(0).toUpperCase() + kind.slice(1)
      } failed. Please try again.`,
    });
  }
}
