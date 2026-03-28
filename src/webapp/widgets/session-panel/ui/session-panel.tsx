import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { SessionCodeForm } from "../../../features/telegram-session/ui/session-code-form";
import { SessionPasswordForm } from "../../../features/telegram-session/ui/session-password-form";
import { SessionStartForm } from "../../../features/telegram-session/ui/session-start-form";

export const SessionPanel = observer(() => {
  const { telegramSessionStore } = useRootStore();
  const status = telegramSessionStore.status;

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

      <SessionStartForm />

      {status?.pendingStep === "code" ? <SessionCodeForm /> : null}

      {status?.pendingStep === "password" ? <SessionPasswordForm /> : null}

      <pre className="code-block">{JSON.stringify(status, null, 2)}</pre>
    </article>
  );
});
