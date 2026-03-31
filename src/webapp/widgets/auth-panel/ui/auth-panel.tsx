import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import {
  formatAuthActionMessage,
  formatAuthDescription,
  formatAuthIdentityHint,
  formatAuthStateLabel,
  formatAuthTitle,
} from "../../../shared/lib/format";

export const AuthPanel = observer(() => {
  const { authStore } = useRootStore();
  const { authState, identity } = authStore;

  return (
    <article className="card auth-card">
      <div className="section-title">
        <h2>{formatAuthTitle(authState)}</h2>
        <span className="badge">{formatAuthStateLabel(authState, identity?.source)}</span>
      </div>
      <p className="muted">{formatAuthDescription(authState, authStore.errorMessage)}</p>
      <p>{formatAuthActionMessage(authState)}</p>
      {identity ? <p className="auth-identity">{formatAuthIdentityHint(identity.telegramUserId, identity.username, identity.firstName)}</p> : null}
    </article>
  );
});
