import { observer } from "mobx-react-lite";

import type { ToastStore } from "../model/toast-store";

export const Toast = observer(({ store }: { store: ToastStore }) => {
  if (!store.isVisible) {
    return null;
  }

  return (
    <div className="toast" style={{ background: store.isError ? "#8c2f39" : "#1f1b18" }}>
      {store.message}
    </div>
  );
});
