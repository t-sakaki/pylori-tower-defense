'use client';

import { useEffect, useRef } from 'react';

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically load everything to avoid SSR issues with window/document
    Promise.all([
      import('phaser'),
      import('@/game/scenes/BootScene'),
      import('@/game/scenes/DiagnosisScene'),
      import('@/game/scenes/BriefingScene'),
      import('@/game/scenes/OathScene'),
      import('@/game/scenes/MenuScene'),
      import('@/game/scenes/GameScene')
    ]).then(([phaserModule, BootSceneModule, DiagnosisSceneModule, BriefingSceneModule, OathSceneModule, MenuSceneModule, GameSceneModule]) => {
      const Phaser = phaserModule.default;
      const BootScene = BootSceneModule.BootScene;
      const DiagnosisScene = DiagnosisSceneModule.DiagnosisScene;
      const BriefingScene = BriefingSceneModule.BriefingScene;
      const OathScene = OathSceneModule.OathScene;
      const MenuScene = MenuSceneModule.MenuScene;
      const GameScene = GameSceneModule.GameScene;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 960,
        height: 640,
        parent: containerRef.current,
        backgroundColor: '#1a0505',
        scene: [BootScene, DiagnosisScene, BriefingScene, OathScene, MenuScene, GameScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
      };

      const game = new Phaser.Game(config);

      return () => {
        game.destroy(true);
      };
    });
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={containerRef}
        className="border-4 border-gastric-900 rounded-lg shadow-2xl"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: '960 / 640',
          display: 'block',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}