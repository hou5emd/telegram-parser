import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const DashboardHeader = observer(() => {
  const rootStore = useRootStore();

  return (
    <section className="hero card">
      <div>
        <p className="eyebrow">Telegram Vacancy Parser</p>
        <h1>Личный кабинет управления вакансиями</h1>
        <p className="muted">Управляйте своими каналами, ключевыми словами и просматривайте найденные вакансии в одном Telegram mini app.</p>
      </div>
      <button className="primary" type="button" disabled={rootStore.isRefreshing} onClick={() => void rootStore.refreshDashboard()}>
        Обновить дашборд
      </button>
    </section>
  );
});
