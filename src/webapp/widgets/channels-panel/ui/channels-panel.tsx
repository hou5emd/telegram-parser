import { observer } from "mobx-react-lite";
import { useState } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const ChannelsPanel = observer(() => {
  const { channelsStore, matchesStore, parserStore, toastStore } = useRootStore();
  const [identifier, setIdentifier] = useState("");

  const runAction = async (action: () => Promise<void>, message: string) => {
    try {
      await action();
      toastStore.show(message);
      await Promise.all([channelsStore.load(), matchesStore.load(), parserStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <article className="card">
      <div className="section-title">
        <h2>Tracked channels</h2>
        <button type="button" disabled={channelsStore.isLoading} onClick={() => void channelsStore.load()}>
          Reload
        </button>
      </div>

      <form
        className="stack inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          void runAction(async () => {
            await channelsStore.add(identifier);
            setIdentifier("");
          }, "Channel added and backfilled");
        }}
      >
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="@jobs_channel or https://t.me/jobs_channel" required />
        <button className="primary" type="submit" disabled={channelsStore.isLoading}>
          Add channel
        </button>
      </form>

      <ul className="list">
        {channelsStore.items.length === 0 ? (
          <li>
            <span className="empty-state">No channels configured yet.</span>
          </li>
        ) : (
          channelsStore.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title || item.username || item.peerId}</strong>
                <div className="muted">{item.username ? `@${item.username}` : item.peerId}</div>
              </div>
              <div className="actions">
                <button type="button" onClick={() => void runAction(() => channelsStore.backfill(item.id), "Backfill finished")}>
                  Backfill
                </button>
                <button className="danger" type="button" onClick={() => void runAction(() => channelsStore.remove(item.id), "Channel removed")}>
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
});
