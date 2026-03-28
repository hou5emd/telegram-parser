import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { formatIdentityMessage } from "../../../shared/lib/format";

export const AuthPanel = observer(() => {
  const { authStore } = useRootStore();
  const identity = authStore.identity;

  return (
    <article className="card">
      <div className="section-title">
        <h2>Auth</h2>
        <span className="badge">{identity?.source ?? (authStore.isLoading ? "Checking" : "Unknown")}</span>
      </div>
      <p className="muted">
        {identity
          ? formatIdentityMessage(identity.telegramUserId, identity.isAdmin)
          : authStore.isLoading
            ? "Waiting for Telegram Web App context."
            : "Authorization state is unavailable."}
      </p>
      <pre className="code-block">{JSON.stringify(authStore.debugInfo, null, 2)}</pre>
    </article>
  );
});
