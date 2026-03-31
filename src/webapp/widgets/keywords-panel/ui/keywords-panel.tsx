import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { AddKeywordForm } from "../../../features/keyword/ui/add-keyword-form";
import { DeleteKeywordButton } from "../../../features/keyword/ui/delete-keyword-button";

export const KeywordsPanel = observer(() => {
  const { keywordsStore } = useRootStore();

  return (
    <article className="card">
      <div className="section-title">
        <h2>Ключевые слова</h2>
        <button type="button" disabled={keywordsStore.isLoading} onClick={() => void keywordsStore.load()}>
          Обновить
        </button>
      </div>

      <div className="grid-two-tight">
        <AddKeywordForm type="include" />
        <AddKeywordForm type="exclude" />
      </div>

      <div className="grid-two-tight">
        <div>
          <h3>Include</h3>
          <ul className="list">
            {keywordsStore.includeItems.length === 0 ? (
              <li>
                <span className="empty-state">Пока пусто.</span>
              </li>
            ) : (
              keywordsStore.includeItems.map((item) => (
                <li key={item.id}>
                  <span className="pill">{item.value}</span>
                  <DeleteKeywordButton keywordId={item.id} />
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
                <span className="empty-state">Пока пусто.</span>
              </li>
            ) : (
              keywordsStore.excludeItems.map((item) => (
                <li key={item.id}>
                  <span className="pill">{item.value}</span>
                  <DeleteKeywordButton keywordId={item.id} />
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </article>
  );
});
