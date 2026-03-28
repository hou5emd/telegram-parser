import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const ParserControlButtons = observer(() => {
  const { parserStore, telegramSessionStore, matchesStore, toastStore } = useRootStore();

  const runAction = async (action: () => Promise<void>, message: string) => {
    try {
      await action();
      toastStore.show(message);
      await Promise.all([parserStore.load(), telegramSessionStore.load(), matchesStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <div className="actions">
      <button type="button" disabled={parserStore.isLoading} onClick={() => void runAction(() => parserStore.pause(), "Parser paused")}>
        Pause
      </button>
      <button type="button" disabled={parserStore.isLoading} onClick={() => void runAction(() => parserStore.resume(), "Parser resumed")}>
        Resume
      </button>
    </div>
  );
});
