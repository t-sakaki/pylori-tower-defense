import GameCanvas from './game/GameCanvas';

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-gastric-500 tracking-wider">
        🦠 ピロリ菌除菌タワーディフェンス
      </h1>
      <GameCanvas />
      <p className="text-sm text-gray-400">
        7日間の服薬を完遂し、胃を守り抜け！
      </p>
    </main>
  );
}
