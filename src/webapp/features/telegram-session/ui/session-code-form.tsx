import { observer } from "mobx-react-lite";
import { useState, type FormEvent } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const SessionCodeForm = observer(() => {
  const { telegramSessionStore, channelsStore, parserStore, toastStore } = useRootStore();
  const [code, setCode] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await telegramSessionStore.submitCode(code);
      setCode("");
      toastStore.show("Код отправлен");
      await Promise.all([telegramSessionStore.load(), channelsStore.load(), parserStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        <span>Код входа</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="12345" required />
      </label>
      <button className="primary" type="submit" disabled={telegramSessionStore.isLoading}>
        Завершить вход
      </button>
    </form>
  );
});
