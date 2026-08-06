'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLng = i18n.language || 'ja';

  return (
    <div className="flex gap-2 items-center bg-slate-800 p-2 rounded-md border border-slate-700">
      <button
        onClick={() => changeLanguage('ja')}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          currentLng.startsWith('ja')
            ? 'bg-blue-600 text-white font-bold'
            : 'text-slate-300 hover:bg-slate-700'
        }`}
      >
        {t('languages.ja')}
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          currentLng.startsWith('en')
            ? 'bg-blue-600 text-white font-bold'
            : 'text-slate-300 hover:bg-slate-700'
        }`}
      >
        {t('languages.en')}
      </button>
    </div>
  );
};
