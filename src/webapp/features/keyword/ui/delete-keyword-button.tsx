import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const DeleteKeywordButton = observer(({ keywordId }: { keywordId: number }) => {
  const { keywordsStore, parserStore, matchesStore, toastStore } = useRootStore();

  const handleClick = async () => {
    try {
      await keywordsStore.remove(keywordId);
      await Promise.all([keywordsStore.load(), parserStore.load(), matchesStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <button className="danger" type="button" onClick={() => void handleClick()}>
      Удалить
    </button>
  );
});
