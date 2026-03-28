import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { formatDateTime } from "../../../shared/lib/format";

export const MatchesPanel = observer(() => {
  const { matchesStore } = useRootStore();

  return (
    <article className="card">
      <div className="section-title">
        <h2>Matches</h2>
        <button type="button" disabled={matchesStore.isLoading} onClick={() => void matchesStore.load()}>
          Reload
        </button>
      </div>

      <ul className="list list-rich">
        {matchesStore.items.length === 0 ? (
          <li>
            <span className="empty-state">No matches yet.</span>
          </li>
        ) : (
          matchesStore.items.map((item) => (
            <li key={item.id}>
              <div className="section-title">
                <strong>{item.channelTitle || item.channelUsername || item.sourcePeerId}</strong>
                <span className="pill">{item.matchedKeywords.join(", ")}</span>
              </div>
              <div>{item.text}</div>
              <div className="section-title">
                <span className="muted">{formatDateTime(item.messageDate || item.createdAt)}</span>
                {item.permalink ? (
                  <a href={item.permalink} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
});
