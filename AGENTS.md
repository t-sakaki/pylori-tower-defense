# pylori-tower-defense プロジェクトガイド

## 概要
pylori-tower-defense は、ピロリ菌をテーマにしたタワーディフェンスゲームです。
Next.js + Phaser で実装され、Vercel にデプロイされています。

## リポジトリ構造
```
/packages
  /web          # フロントエンド (Next.js)
  /api          # Cloudflare Workers API (ワーカー)
  /shared       # 共有型定義・ユーティリティ
```

## 開発環境
- Node.js (v20 推奨)
- pnpm (v9)

### セットアップ
```bash
pnpm install
```

### ローカル開発
```bash
pnpm dev   # TurboRepo で全パッケージの dev スクリプトを実行
```

### ビルド
```bash
pnpm build
```

### Lint
```bash
pnpm lint
```

## デプロイ
本プロジェクトは Vercel に静的サイトとしてデプロイされています。
- ビルドコマンド: `pnpm run build` (turbo経由)
- 出力ディレクトリ: `packages/web/out`
- 環境変数:
  - `NEXT_PUBLIC_API_URL`: Cloudflare Workers エンドポイント

### Vercel 設定 (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "packages/web/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "out" }
    }
  ]
}
```

## 注意点
- ESLint 設定は `@next/core-web-vitals` を拡張し、`eslint` と `eslint-config-next` がインストールされています。
- `next.config.js` で `output: 'export'` を指定し、静的エクスポートを行っています。
- API は別途 Cloudflare Workers (`pylori-api.taira-sakakibara.workers.dev`) にデプロイされています。

## トラブルシューティング
- ビルド時に "No Output Directory named 'public' found" というエラーが出た場合は、vercel.json の `distDir` を `out` に設定しているか確認してください。
- ESLint エラーは `eslint` と `eslint-config-next` のバージョンを合わせることで解消できます（現在 8.57.0 と 14.2.0 を使用）。