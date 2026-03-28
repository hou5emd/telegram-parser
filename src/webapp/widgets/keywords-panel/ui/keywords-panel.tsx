import { observer } from "mobx-react-lite";
import { useState } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const KeywordsPanel = observer(() => {
  const { keywordsStore, parserStore, matchesStore, toastStore } = useRootStore();
  const [includeValue, setIncludeValue] = useState("");
  const [excludeValue, setExcludeValue] = useState("");

  const runAction = async (action: () => Promise<void>, message?: string) => {
    try {
      await action();
      if (message) {
        toastStore.show(message);
      }
      await Promise.all([keywordsStore.load(), parserStore.load(), matchesStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <article className="card">
      <div className="section-title">
        <h2>Keywords</h2>
        <button type="button" disabled={keywordsStore.isLoading} onClick={() => void keywordsStore.load()}>
          Reload
        </button>
      </div>

      <div className="grid-two-tight">
        <form
          className="stack inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(async () => {
              await keywordsStore.add("include", includeValue);
              setIncludeValue("");
            });
          }}
        >
          <input value={includeValue} onChange={(event) => setIncludeValue(event.target.value)} placeholder="include keyword" required />
          <button className="primary" type="submit" disabled={keywordsStore.isLoading}>
            Add include
          </button>
        </form>

        <form
          className="stack inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(async () => {
              await keywordsStore.add("exclude", excludeValue);
              setExcludeValue("");
            });
          }}
        >
          <input value={excludeValue} onChange={(event) => setExcludeValue(event.target.value)} placeholder="exclude keyword" required />
          <button type="submit" disabled={keywordsStore.isLoading}>
            Add exclude
          </button>
        </form>
      </div>

      <div className="grid-two-tight">
        <div>
          <h3>Include</h3>
          <ul className="list">
            {keywordsStore.includeItems.length === 0 ? (
              <li>
                <span className="empty-state">No items yet.</span>
              </li>
            ) : (
              keywordsStore.includeItems.map((item) => (
                <li key={item.id}>
                  <span className="pill">{item.value}</span>
                  <button className="danger" type="button" onClick={() => void runAction(() => keywordsStore.remove(item.id))}>
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3>Exclude</h3>
          <ul className="list">
            {keywordsStore.excludeItems.length === 0 ? (
              <li>
                <span className="empty-state">No items yet.</span>
              </li>
            ) : (
              keywordsStore.excludeItems.map((item) => (
                <li key={item.id}>
                  <span className="pill">{item.value}</span>
                  <button className="danger" type="button" onClick={() => void runAction(() => keywordsStore.remove(item.id))}>
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </article>
  );
});
