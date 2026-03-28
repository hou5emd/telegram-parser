import { createContext, useContext, useMemo, type ReactNode } from "react";

import { RootStore } from "../store/root-store";

const RootStoreContext = createContext<RootStore | null>(null);

export const RootStoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useMemo(() => new RootStore(), []);

  return <RootStoreContext.Provider value={store}>{children}</RootStoreContext.Provider>;
};

export const useRootStore = () => {
  const store = useContext(RootStoreContext);

  if (!store) {
    throw new Error("RootStoreProvider is missing");
  }

  return store;
};
