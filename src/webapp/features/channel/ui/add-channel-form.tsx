import { observer } from "mobx-react-lite";
import { useState, type FormEvent } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const AddChannelForm = observer(() => {
  const { channelsStore, matchesStore, parserStore, toastStore } = useRootStore();
  const [identifier, setIdentifier] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await channelsStore.add(identifier);
      setIdentifier("");
      toastStore.show("Channel added and backfilled");
      await Promise.all([channelsStore.load(), matchesStore.load(), parserStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <form className="stack inline-form" onSubmit={(event) => void handleSubmit(event)}>
      <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="@jobs_channel or https://t.me/jobs_channel" required />
      <button className="primary" type="submit" disabled={channelsStore.isLoading}>
        Add channel
      </button>
    </form>
  );
});
