import { observer } from "mobx-react-lite";
import { useState, type FormEvent } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const AddKeywordForm = observer(({ type }: { type: "include" | "exclude" }) => {
  const { keywordsStore, parserStore, matchesStore, toastStore } = useRootStore();
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await keywordsStore.add(type, value);
      setValue("");
      await Promise.all([keywordsStore.load(), parserStore.load(), matchesStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <form className="stack inline-form" onSubmit={(event) => void handleSubmit(event)}>
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={type === "include" ? "Ключевое слово для include" : "Ключевое слово для exclude"} required />
      <button className={type === "include" ? "primary" : undefined} type="submit" disabled={keywordsStore.isLoading}>
        {type === "include" ? "Добавить в include" : "Добавить в exclude"}
      </button>
    </form>
  );
});
