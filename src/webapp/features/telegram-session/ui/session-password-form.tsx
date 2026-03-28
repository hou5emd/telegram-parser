import { observer } from "mobx-react-lite";
import { useState, type FormEvent } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const SessionPasswordForm = observer(() => {
  const { telegramSessionStore, channelsStore, parserStore, toastStore } = useRootStore();
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await telegramSessionStore.submitPassword(password);
      setPassword("");
      toastStore.show("Telegram session connected");
      await Promise.all([telegramSessionStore.load(), channelsStore.load(), parserStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        <span>2FA password</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Telegram password" required />
      </label>
      <button className="primary" type="submit" disabled={telegramSessionStore.isLoading}>
        Submit password
      </button>
    </form>
  );
});
