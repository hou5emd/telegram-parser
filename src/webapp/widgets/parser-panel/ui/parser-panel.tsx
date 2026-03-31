import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { ParserControlButtons } from "../../../features/parser/ui/parser-control-buttons";

export const ParserPanel = observer(() => {
  const { parserStore, authStore } = useRootStore();
  const status = parserStore.status;

  return (
    <article className="card">
      <div className="section-title">
        <h2>Парсер</h2>
        {authStore.identity?.isAdmin ? <ParserControlButtons /> : null}
      </div>

      <dl className="stats">
        <div>
          <dt>На паузе</dt>
          <dd>{status ? (status.parser.paused ? "Да" : "Нет") : "-"}</dd>
        </div>
        <div>
          <dt>Каналы</dt>
          <dd>{status?.parser.trackedChannels ?? 0}</dd>
        </div>
        <div>
          <dt>Include</dt>
          <dd>{status?.parser.includeKeywords ?? 0}</dd>
        </div>
        <div>
          <dt>Exclude</dt>
          <dd>{status?.parser.excludeKeywords ?? 0}</dd>
        </div>
        <div>
          <dt>Совпадения</dt>
          <dd>{status?.parser.totalMatches ?? 0}</dd>
        </div>
        <div>
          <dt>Бот</dt>
          <dd>{status ? (status.bot.configured ? status.bot.mode : "отключён") : "-"}</dd>
        </div>
      </dl>
    </article>
  );
});
