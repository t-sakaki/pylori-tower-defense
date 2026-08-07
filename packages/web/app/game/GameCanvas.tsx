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
      import('@/game/scenes/MenuScene'),
      import('@/game/scenes/GameScene')
    ]).then(([phaserModule, BootSceneModule, MenuSceneModule, GameSceneModule]) => {
      const Phaser = phaserModule.default;
      const BootScene = BootSceneModule.BootScene;
      const MenuScene = MenuSceneModule.MenuScene;
      const GameScene = GameSceneModule.GameScene;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 960,
        height: 640,
        parent: containerRef.current,
        backgroundColor: '#1a0505',
        scene: [BootScene, MenuScene, GameScene],
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
      ref={containerRef}
      className="border-4 border-gastric-900 rounded-lg shadow-2xl overflow-hidden"
      style={{ width: '100%', height: '100%', maxWidth: '960px', maxHeight: '640px', aspectRatio: '960/640' }}
    />
  );
}