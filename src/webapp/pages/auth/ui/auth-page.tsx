import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { SessionPanel } from "../../../widgets/session-panel/ui/session-panel";
import { AuthPanel } from "../../../widgets/auth-panel/ui/auth-panel";

export const AuthPage = observer(() => {
  const { authStore, telegramSessionStore } = useRootStore();
  const shouldShowPhoneAuth = authStore.isAdmin;

  return (
    <main className="auth-layout">
      <section className="auth-shell">
        <p className="eyebrow">Telegram Vacancy Parser</p>
        <AuthPanel />

        <section className="auth-cta card">
          <strong>Как продолжить</strong>
          <p className="muted">
            {shouldShowPhoneAuth
              ? "Для входа в панель теперь обязательна авторизация Telegram по номеру телефона."
              : authStore.authState === "authorized-non-admin"
              ? "Эта панель доступна только для Telegram-аккаунта, назначенного администратором."
              : "Запустите mini app из Telegram, чтобы приложение могло передать подписанные init data в backend."}
          </p>
          <p className="muted">
            {shouldShowPhoneAuth
              ? telegramSessionStore.isAuthorized
                ? "Номер телефона подтверждён. Подготавливаем данные панели."
                : "Пока номер не подтверждён, доступ к дашборду закрыт."
              : "При прямом открытии в браузере нет auth-контекста Telegram Web App, поэтому панель не может проверить доступ."}
          </p>
        </section>

        {shouldShowPhoneAuth ? <SessionPanel showDebug={false} /> : null}
      </section>
    </main>
  );
});
