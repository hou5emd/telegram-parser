import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { SessionCodeForm } from "../../../features/telegram-session/ui/session-code-form";
import { SessionPasswordForm } from "../../../features/telegram-session/ui/session-password-form";
import { SessionStartForm } from "../../../features/telegram-session/ui/session-start-form";

export const SessionPanel = observer(({ showDebug = true }: { showDebug?: boolean }) => {
  const { telegramSessionStore } = useRootStore();
  const status = telegramSessionStore.status;

  return (
    <article className="card">
      <div className="section-title">
        <h2>Подключение Telegram</h2>
        <span className="badge">
          {status?.authorized ? "Подключён" : status?.pendingStep === "password" ? "Нужен пароль" : status?.pendingStep === "code" ? "Нужен код" : "Ожидание"}
        </span>
      </div>
      <p className="muted">Каждый пользователь подключает свой Telegram-аккаунт для доступа к каналам и живого парсинга.</p>
      <p className="muted">API-учётные данные загружаются из env сервера. Подключите свой Telegram-аккаунт по номеру телефона.</p>

      <SessionStartForm />

      {status?.pendingStep === "code" ? <SessionCodeForm /> : null}

      {status?.pendingStep === "password" ? <SessionPasswordForm /> : null}

      {showDebug ? <pre className="code-block">{JSON.stringify(status, null, 2)}</pre> : null}
    </article>
  );
});
