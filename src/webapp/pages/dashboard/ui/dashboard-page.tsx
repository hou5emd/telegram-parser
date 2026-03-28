import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { Toast } from "../../../shared/ui/toast";
import { AuthPanel } from "../../../widgets/auth-panel/ui/auth-panel";
import { ChannelsPanel } from "../../../widgets/channels-panel/ui/channels-panel";
import { DashboardHeader } from "../../../widgets/dashboard-header/ui/dashboard-header";
import { KeywordsPanel } from "../../../widgets/keywords-panel/ui/keywords-panel";
import { MatchesPanel } from "../../../widgets/matches-panel/ui/matches-panel";
import { ParserPanel } from "../../../widgets/parser-panel/ui/parser-panel";
import { SessionPanel } from "../../../widgets/session-panel/ui/session-panel";

export const DashboardPage = observer(() => {
  const rootStore = useRootStore();

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

  return (
    <>
      <main className="layout">
        <DashboardHeader />

        {!rootStore.isReady && <div className="card loading-panel muted">Loading dashboard...</div>}

        <section className="grid-two">
          <AuthPanel />
          <ParserPanel />
        </section>

        <section className="grid-two">
          <SessionPanel />
          <ChannelsPanel />
        </section>

        <section className="grid-two">
          <KeywordsPanel />
          <MatchesPanel />
        </section>
      </main>

      <Toast store={rootStore.toastStore} />
    </>
  );
});
