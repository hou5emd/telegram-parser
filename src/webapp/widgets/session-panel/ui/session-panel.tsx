import { observer } from "mobx-react-lite";
import { useState } from "react";

import { useRootStore } from "../../../app/providers/root-store-provider";

export const SessionPanel = observer(() => {
  const { telegramSessionStore, toastStore, channelsStore, parserStore } = useRootStore();
  const status = telegramSessionStore.status;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const runAction = async (action: () => Promise<void>, message: string) => {
    try {
      await action();
      toastStore.show(message);
      await Promise.all([telegramSessionStore.load(), channelsStore.load(), parserStore.load()]);
    } catch (error) {
      toastStore.showError(error);
    }
  };

  return (
    <article className="card">
      <div className="section-title">
        <h2>Connect Telegram</h2>
        <span className="badge">
          {status?.authorized ? "Authorized" : status?.pendingStep === "password" ? "Password required" : status?.pendingStep === "code" ? "Code required" : "Idle"}
        </span>
      </div>
      <p className="muted">Each user connects their own Telegram account for channel access and live parsing.</p>
      <p className="muted">API credentials are loaded from server env. Connect your own Telegram account by phone number.</p>

      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          void runAction(async () => {
            await telegramSessionStore.startLogin(phoneNumber);
            setCode("");
            setPassword("");
          }, "Login code requested");
        }}
      >
        <label>
          <span>Phone</span>
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+79990000000" required />
        </label>
        <button className="primary" type="submit" disabled={telegramSessionStore.isLoading}>
          Send login code
        </button>
      </form>

      {status?.pendingStep === "code" ? (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(async () => {
              await telegramSessionStore.submitCode(code);
              setCode("");
            }, "Code submitted");
          }}
        >
          <label>
            <span>Login code</span>
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="12345" required />
          </label>
          <button className="primary" type="submit" disabled={telegramSessionStore.isLoading}>
            Complete login
          </button>
        </form>
      ) : null}

      {status?.pendingStep === "password" ? (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(async () => {
              await telegramSessionStore.submitPassword(password);
              setPassword("");
            }, "Telegram session connected");
          }}
        >
          <label>
            <span>2FA password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Telegram password" required />
          </label>
          <button className="primary" type="submit" disabled={telegramSessionStore.isLoading}>
            Submit password
          </button>
        </form>
      ) : null}

      <pre className="code-block">{JSON.stringify(status, null, 2)}</pre>
    </article>
  );
});
