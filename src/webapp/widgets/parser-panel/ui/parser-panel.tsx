import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const ParserPanel = observer(() => {
  const rootStore = useRootStore();
  const { parserStore, authStore, telegramSessionStore, matchesStore, toastStore } = rootStore;
  const status = parserStore.status;

  const withRefresh = async (action: () => Promise<void>, message: string) => {
    try {
      await action();
      toastStore.show(message);
      await Promise.all([parserStore.load(), telegramSessionStore.load(), matchesStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <article className="card">
      <div className="section-title">
        <h2>Parser</h2>
        {authStore.identity?.isAdmin ? (
          <div className="actions">
            <button type="button" disabled={parserStore.isLoading} onClick={() => void withRefresh(() => parserStore.pause(), "Parser paused")}>
              Pause
            </button>
            <button type="button" disabled={parserStore.isLoading} onClick={() => void withRefresh(() => parserStore.resume(), "Parser resumed")}>
              Resume
            </button>
          </div>
        ) : null}
      </div>

      <dl className="stats">
        <div>
          <dt>Paused</dt>
          <dd>{status ? (status.parser.paused ? "Yes" : "No") : "-"}</dd>
        </div>
        <div>
          <dt>Channels</dt>
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
          <dt>Matches</dt>
          <dd>{status?.parser.totalMatches ?? 0}</dd>
        </div>
        <div>
          <dt>Bot</dt>
          <dd>{status ? (status.bot.configured ? status.bot.mode : "disabled") : "-"}</dd>
        </div>
      </dl>
    </article>
  );
});
