import { observer } from "mobx-react-lite";
import { useState, type FormEvent } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const SessionStartForm = observer(() => {
  const { telegramSessionStore, channelsStore, parserStore, toastStore } = useRootStore();
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await telegramSessionStore.startLogin(phoneNumber);
      setPhoneNumber("");
      toastStore.show("Код входа запрошен");
      await Promise.all([telegramSessionStore.load(), channelsStore.load(), parserStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <form className="stack" onSubmit={(event) => handleSubmit(event)}>
      <label>
        <span>Телефон</span>
        <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+79990000000" required />
      </label>
      <button className="primary" type="submit" disabled={telegramSessionStore.isLoading}>
        Отправить код входа
      </button>
    </form>
  );
});
