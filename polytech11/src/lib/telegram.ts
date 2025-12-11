import type { TelegramWebApp } from '../types/telegram';

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const useTelegramWebApp = () => {
  const webApp = getTelegramWebApp();

  return {
    webApp,
    user: webApp?.initDataUnsafe?.user,
    isReady: !!webApp,
  };
};

export const initTelegramWebApp = () => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
  return webApp;
};
