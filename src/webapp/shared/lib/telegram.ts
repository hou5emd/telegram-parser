declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
    __telegramSdkLoaded?: boolean;
    __telegramSdkLoadError?: string | null;
  }
}

export interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      username?: string;
    };
    query_id?: string;
    auth_date?: string;
  };
  ready?: () => void;
  expand?: () => void;
  platform?: string;
  version?: string;
  colorScheme?: string;
  isExpanded?: boolean;
  viewportHeight?: number;
  headerColor?: string;
  backgroundColor?: string;
}

export const getTelegramWebApp = () => window.Telegram?.WebApp;

export const getTelegramInitData = () => getTelegramWebApp()?.initData ?? "";

export const initializeTelegramWebApp = () => {
  const telegramWebApp = getTelegramWebApp();

  telegramWebApp?.ready?.();
  telegramWebApp?.expand?.();
};

export const getTelegramSdkState = () => ({
  tg: getTelegramWebApp(),
  sdkLoaded: window.__telegramSdkLoaded === true,
  sdkLoadError: window.__telegramSdkLoadError || null,
});

export const getLocalDebugInfo = () => {
  const sdkState = getTelegramSdkState();
  const telegramWebApp = sdkState.tg;

  return {
    sdkLoaded: sdkState.sdkLoaded,
    sdkLoadError: sdkState.sdkLoadError,
    hasTelegramObject: Boolean(window.Telegram),
    hasWebAppObject: Boolean(telegramWebApp),
    initDataLength: telegramWebApp?.initData?.length ?? 0,
    initDataUnsafeUserId: telegramWebApp?.initDataUnsafe?.user?.id ?? null,
    initDataUnsafeUsername: telegramWebApp?.initDataUnsafe?.user?.username ?? null,
    initDataUnsafeQueryId: telegramWebApp?.initDataUnsafe?.query_id ?? null,
    initDataUnsafeAuthDate: telegramWebApp?.initDataUnsafe?.auth_date ?? null,
    platform: telegramWebApp?.platform ?? null,
    version: telegramWebApp?.version ?? null,
    colorScheme: telegramWebApp?.colorScheme ?? null,
    isExpanded: typeof telegramWebApp?.isExpanded === "boolean" ? telegramWebApp.isExpanded : null,
    viewportHeight: telegramWebApp?.viewportHeight ?? null,
    headerColor: telegramWebApp?.headerColor ?? null,
    backgroundColor: telegramWebApp?.backgroundColor ?? null,
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    href: window.location.href,
    isIframe: window.self !== window.top,
  };
};
