import { Reducer } from "react";

export interface TokenState {
  balance: string;
  approvedAmount: string;
  amount: string;
  error: string | null;
  approveHash?: `0x${string}`;
  transferHash?: `0x${string}`;
  mintHash?: `0x${string}`;
}

export type TokenAction =
  | { type: "SET_AMOUNT"; payload: string }
  | { type: "SET_BALANCE"; payload: bigint }
  | { type: "SET_APPROVED_AMOUNT"; payload: bigint }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_HASH";
      payload: { kind: "approve" | "transfer" | "mint"; hash?: `0x${string}` };
    };

export const initialState: TokenState = {
  balance: "0",
  approvedAmount: "0",
  amount: "",
  error: null,
};

export const tokenReducer: Reducer<TokenState, TokenAction> = (
  state,
  action
) => {
  switch (action.type) {
    case "SET_AMOUNT":
      return { ...state, amount: action.payload };
    case "SET_BALANCE":
      return { ...state, balance: action.payload.toString() };
    case "SET_APPROVED_AMOUNT":
      return { ...state, approvedAmount: action.payload.toString() };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_HASH": {
      const { kind, hash } = action.payload;
      if (kind === "approve") return { ...state, approveHash: hash };
      if (kind === "transfer") return { ...state, transferHash: hash };
      return { ...state, mintHash: hash };
    }
    default:
      return state;
  }
};
