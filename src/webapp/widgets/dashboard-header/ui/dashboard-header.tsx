import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const DashboardHeader = observer(() => {
  const rootStore = useRootStore();

  return (
    <section className="hero card">
      <div>
        <p className="eyebrow">Telegram Vacancy Parser</p>
        <h1>Personal vacancy control panel</h1>
        <p className="muted">Manage your own tracked channels and keyword rules, and inspect matched vacancies in one Telegram mini app.</p>
      </div>
      <button className="primary" type="button" disabled={rootStore.isRefreshing} onClick={() => void rootStore.refreshDashboard()}>
        Refresh dashboard
      </button>
    </section>
  );
});
