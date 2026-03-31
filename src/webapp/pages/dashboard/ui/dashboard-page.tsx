import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { ChannelsPanel } from "../../../widgets/channels-panel/ui/channels-panel";
import { DashboardHeader } from "../../../widgets/dashboard-header/ui/dashboard-header";
import { KeywordsPanel } from "../../../widgets/keywords-panel/ui/keywords-panel";
import { MatchesPanel } from "../../../widgets/matches-panel/ui/matches-panel";
import { ParserPanel } from "../../../widgets/parser-panel/ui/parser-panel";

export const DashboardPage = observer(() => {
  const rootStore = useRootStore();

  return (
    <main className="layout">
      <DashboardHeader />

      {!rootStore.isReady && <div className="card loading-panel muted">Загружаем дашборд...</div>}

      <section className="grid-two">
        <ParserPanel />
        <ChannelsPanel />
      </section>

      <section className="grid-two">
        <KeywordsPanel />
        <MatchesPanel />
      </section>
    </main>
  );
});
