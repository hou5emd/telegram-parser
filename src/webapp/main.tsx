import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import { RootStoreProvider } from "./app/providers/root-store-provider";
import "./app/styles.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(
  <RootStoreProvider>
    <App />
  </RootStoreProvider>
);
