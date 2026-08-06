import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import jaGame from '../../public/locales/ja/game.json';
import jaCommon from '../../public/locales/ja/common.json';
import enGame from '../../public/locales/en/game.json';
import enCommon from '../../public/locales/en/common.json';

export const defaultNS = 'game';
export const resources = {
  ja: {
    game: jaGame,
    common: jaCommon,
  },
  en: {
    game: enGame,
    common: enCommon,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    defaultNS,
    ns: ['game', 'common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
