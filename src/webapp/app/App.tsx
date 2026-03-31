import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { AuthPage } from "../pages/auth/ui/auth-page";
import { DashboardPage } from "../pages/dashboard/ui/dashboard-page";
import { Toast } from "../shared/ui/toast";
import { useRootStore } from "./providers/root-store-provider";

export const App = observer(() => {
  const rootStore = useRootStore();
  const canAccessDashboard = rootStore.authStore.isAdmin && rootStore.telegramSessionStore.isAuthorized;

  useEffect(() => {
    void rootStore.initialize();

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      rootStore.toastStore.showError(event.reason);
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [rootStore]);

  useEffect(() => {
    if (!canAccessDashboard || rootStore.isReady || rootStore.isRefreshing) {
      return;
    }

    void rootStore.initializeDashboard();
  }, [canAccessDashboard, rootStore]);

  return (
    <>
      {canAccessDashboard ? <DashboardPage /> : <AuthPage />}
      <Toast store={rootStore.toastStore} />
    </>
  );
});
