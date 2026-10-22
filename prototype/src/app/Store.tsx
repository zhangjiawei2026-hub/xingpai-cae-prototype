import { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";
import type { Action, WorkState } from "../types/domain";
import { initialState } from "../data/demo";
import { reducer } from "./reducer";
const Context = createContext<{
  state: WorkState;
  dispatch: Dispatch<Action>;
} | null>(null);
export function Store({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace must be inside Store");
  return value;
}
