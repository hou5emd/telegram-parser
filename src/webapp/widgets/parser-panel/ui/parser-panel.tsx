import { observer } from "mobx-react-lite";

import { useRootStore } from "../../../app/providers/root-store-provider";
import { ParserControlButtons } from "../../../features/parser/ui/parser-control-buttons";

export const ParserPanel = observer(() => {
  const { parserStore, authStore } = useRootStore();
  const status = parserStore.status;

  return (
    <article className="card">
      <div className="section-title">
        <h2>Parser</h2>
        {authStore.identity?.isAdmin ? <ParserControlButtons /> : null}
      </div>

      <dl className="stats">
        <div>
          <dt>Paused</dt>
          <dd>{status ? (status.parser.paused ? "Yes" : "No") : "-"}</dd>
        </div>
        <div>
          <dt>Channels</dt>
          <dd>{status?.parser.trackedChannels ?? 0}</dd>
        </div>
        <div>
          <dt>Include</dt>
          <dd>{status?.parser.includeKeywords ?? 0}</dd>
        </div>
        <div>
          <dt>Exclude</dt>
          <dd>{status?.parser.excludeKeywords ?? 0}</dd>
        </div>
        <div>
          <dt>Matches</dt>
          <dd>{status?.parser.totalMatches ?? 0}</dd>
        </div>
        <div>
          <dt>Bot</dt>
          <dd>{status ? (status.bot.configured ? status.bot.mode : "disabled") : "-"}</dd>
        </div>
      </dl>
    </article>
  );
});
