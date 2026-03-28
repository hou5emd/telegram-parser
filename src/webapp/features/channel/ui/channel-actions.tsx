import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const ChannelActions = observer(({ channelId }: { channelId: number }) => {
  const { channelsStore, matchesStore, parserStore, toastStore } = useRootStore();

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
    <div className="actions">
      <button type="button" onClick={() => void runAction(() => channelsStore.backfill(channelId), "Backfill finished")}>
        Backfill
      </button>
      <button className="danger" type="button" onClick={() => void runAction(() => channelsStore.remove(channelId), "Channel removed")}>
        Delete
      </button>
    </div>
  );
});
