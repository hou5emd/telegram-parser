const tg = window.Telegram?.WebApp;
const initData = tg?.initData || "";

if (tg) {
  tg.ready();
  tg.expand();
}

const authBadge = document.querySelector("#auth-badge");
const authMessage = document.querySelector("#auth-message");
const sessionBadge = document.querySelector("#session-badge");
const parserStatus = document.querySelector("#parser-status");
const sessionSummary = document.querySelector("#session-summary");
const channelsList = document.querySelector("#channels-list");
const includeList = document.querySelector("#include-list");
const excludeList = document.querySelector("#exclude-list");
const matchesList = document.querySelector("#matches-list");
const toast = document.querySelector("#toast");
const sessionStartForm = document.querySelector("#session-start-form");
const sessionCodeForm = document.querySelector("#session-code-form");
const sessionPasswordForm = document.querySelector("#session-password-form");

const showToast = (message, isError = false) => {
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.style.background = isError ? "#8c2f39" : "#1f1b18";
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.add("hidden"), 3600);
};

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});

  if (initData) {
    headers.set("x-telegram-init-data", initData);
  }

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || payload || `Request failed: ${response.status}`);
  }

  return payload;
};

const renderStats = (status) => {
  parserStatus.innerHTML = "";

  const entries = [
    ["Paused", status.parser.paused ? "Yes" : "No"],
    ["Channels", status.parser.trackedChannels],
    ["Include", status.parser.includeKeywords],
    ["Exclude", status.parser.excludeKeywords],
    ["Matches", status.parser.totalMatches],
    ["Bot", status.bot.configured ? status.bot.mode : "disabled"],
  ];

  for (const [label, value] of entries) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
    parserStatus.appendChild(wrapper);
  }
};

const renderSession = (status) => {
  sessionBadge.textContent = status.authorized ? "Authorized" : status.pendingStep === "password" ? "Password required" : status.pendingStep === "code" ? "Code required" : "Idle";
  sessionSummary.textContent = JSON.stringify(status, null, 2);
  sessionCodeForm.classList.toggle("hidden", status.pendingStep !== "code");
  sessionPasswordForm.classList.toggle("hidden", status.pendingStep !== "password");
};

const renderChannels = (items) => {
  channelsList.innerHTML = "";

  if (items.length === 0) {
    channelsList.innerHTML = `<li><span>No channels configured yet.</span></li>`;
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${item.title || item.username || item.peerId}</strong>
        <div class="muted">${item.username ? `@${item.username}` : item.peerId}</div>
      </div>
      <div class="actions">
        <button data-action="backfill" data-id="${item.id}">Backfill</button>
        <button class="danger" data-action="delete-channel" data-id="${item.id}">Delete</button>
      </div>
    `;
    channelsList.appendChild(li);
  }
};

const renderKeywords = (items) => {
  includeList.innerHTML = "";
  excludeList.innerHTML = "";

  const renderInto = (target, values) => {
    if (values.length === 0) {
      target.innerHTML = `<li><span>No items yet.</span></li>`;
      return;
    }

    for (const item of values) {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="pill">${item.value}</span>
        <button class="danger" data-action="delete-keyword" data-id="${item.id}">Delete</button>
      `;
      target.appendChild(li);
    }
  };

  renderInto(includeList, items.filter((item) => item.type === "include"));
  renderInto(excludeList, items.filter((item) => item.type === "exclude"));
};

const renderMatches = (items) => {
  matchesList.innerHTML = "";

  if (items.length === 0) {
    matchesList.innerHTML = `<li><span>No matches yet.</span></li>`;
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="section-title">
        <strong>${item.channelTitle || item.channelUsername || item.sourcePeerId}</strong>
        <span class="pill">${item.matchedKeywords.join(", ")}</span>
      </div>
      <div>${item.text}</div>
      <div class="section-title">
        <span class="muted">${item.messageDate || item.createdAt}</span>
        ${item.permalink ? `<a href="${item.permalink}" target="_blank" rel="noreferrer">Open</a>` : ""}
      </div>
    `;
    matchesList.appendChild(li);
  }
};

const loadDashboard = async () => {
  const [auth, status, session, channels, keywords, matches] = await Promise.all([
    request("/api/auth/webapp/validate", { method: "POST", body: JSON.stringify({}) }),
    request("/api/status"),
    request("/api/telegram/session/status"),
    request("/api/channels"),
    request("/api/keywords"),
    request("/api/matches?limit=20"),
  ]);

  authBadge.textContent = auth.identity.source;
  authMessage.textContent = auth.identity.telegramUserId
    ? `Authorized as Telegram user ${auth.identity.telegramUserId}.`
    : "Authorized in development bypass mode.";

  renderStats(status);
  renderSession(session);
  renderChannels(channels.items);
  renderKeywords(keywords.items);
  renderMatches(matches.items);
};

document.querySelector("#refresh-dashboard").addEventListener("click", () => {
  loadDashboard().catch((error) => showToast(error.message, true));
});

document.querySelector("#pause-parser").addEventListener("click", async () => {
  await request("/api/parser/pause", { method: "POST", body: JSON.stringify({}) });
  showToast("Parser paused");
  await loadDashboard();
});

document.querySelector("#resume-parser").addEventListener("click", async () => {
  await request("/api/parser/resume", { method: "POST", body: JSON.stringify({}) });
  showToast("Parser resumed");
  await loadDashboard();
});

sessionStartForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(sessionStartForm);
  const payload = Object.fromEntries(form.entries());

  await request("/api/telegram/session/start", {
    method: "POST",
    body: JSON.stringify({
      apiId: Number(payload.apiId),
      apiHash: payload.apiHash,
      phoneNumber: payload.phoneNumber,
    }),
  });

  showToast("Login code requested");
  await loadDashboard();
});

sessionCodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(sessionCodeForm);

  await request("/api/telegram/session/complete-code", {
    method: "POST",
    body: JSON.stringify({ code: form.get("code") }),
  });

  showToast("Code submitted");
  await loadDashboard();
});

sessionPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(sessionPasswordForm);

  await request("/api/telegram/session/complete-password", {
    method: "POST",
    body: JSON.stringify({ password: form.get("password") }),
  });

  showToast("Telegram session connected");
  await loadDashboard();
});

document.querySelector("#channel-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  await request("/api/channels", {
    method: "POST",
    body: JSON.stringify({ identifier: form.get("identifier"), backfillLimit: 20 }),
  });

  event.currentTarget.reset();
  showToast("Channel added and backfilled");
  await loadDashboard();
});

document.querySelector("#include-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  await request("/api/keywords", {
    method: "POST",
    body: JSON.stringify({ type: "include", value: form.get("value") }),
  });

  event.currentTarget.reset();
  await loadDashboard();
});

document.querySelector("#exclude-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  await request("/api/keywords", {
    method: "POST",
    body: JSON.stringify({ type: "exclude", value: form.get("value") }),
  });

  event.currentTarget.reset();
  await loadDashboard();
});

channelsList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "delete-channel") {
    await request(`/api/channels/${id}`, { method: "DELETE" });
    showToast("Channel removed");
  }

  if (action === "backfill") {
    await request(`/api/channels/${id}/backfill`, { method: "POST", body: JSON.stringify({ limit: 25 }) });
    showToast("Backfill finished");
  }

  await loadDashboard();
});

document.body.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='delete-keyword']");

  if (!button) {
    return;
  }

  await request(`/api/keywords/${button.dataset.id}`, { method: "DELETE" });
  await loadDashboard();
});

for (const selector of ["#reload-channels", "#reload-keywords", "#reload-matches"]) {
  document.querySelector(selector).addEventListener("click", () => {
    loadDashboard().catch((error) => showToast(error.message, true));
  });
}

loadDashboard().catch((error) => {
  authBadge.textContent = "Error";
  authMessage.textContent = error.message;
  showToast(error.message, true);
});
