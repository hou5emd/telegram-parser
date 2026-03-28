import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { ChannelActions } from "../../../features/channel/ui/channel-actions";
import { AddChannelForm } from "../../../features/channel/ui/add-channel-form";

export const ChannelsPanel = observer(() => {
  const { channelsStore } = useRootStore();

  return (
    <article className="card">
      <div className="section-title">
        <h2>Tracked channels</h2>
        <button type="button" disabled={channelsStore.isLoading} onClick={() => void channelsStore.load()}>
          Reload
        </button>
      </div>

      <AddChannelForm />

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
              <ChannelActions channelId={item.id} />
            </li>
          ))
        )}
      </ul>
    </article>
  );
});
