'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import GameCanvas from './game/GameCanvas';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function Home() {
  const { t } = useTranslation('common');

  return (
    <main className="flex flex-col items-center gap-4 py-6">
      <div className="w-full max-w-4xl flex justify-between items-center px-4">
        <h1 className="text-2xl font-bold text-gastric-500 tracking-wider">
          🦠 {t('menu.title')}
        </h1>
        <LanguageSelector />
      </div>
      <GameCanvas />
    </main>
  );
}
