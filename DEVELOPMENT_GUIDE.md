# 🛠️ ピロリ菌除菌タワーディフェンス — 開発・テスト環境構成案

ご提供いただいた環境を最大限に活かし、**各サービスの強みを分担**させたハイブリッド構成を提案します。

---

## 🏗️ 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                      エンドユーザー層                         │
│         (PCブラウザ / スマホブラウザ / タブレット)            │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌──────────┐          ┌──────────┐
   │  Vercel │          │Cloudflare│          │ LOLIPOP  │
   │(Next.js │◄────────►│ Workers  │          │ レンタル │
   │+ Phaser)│   API    │ (API/AI) │          │ サーバー │
   │ 静的CDN │          │          │          │(バックア │
   └─────────┘          └──────────┘          │ ップ用)  │
        │                     │                 └──────────┘
        │                     │
        │              ┌──────┴──────┐
        │              ▼             ▼
        │        ┌─────────┐   ┌─────────┐
        │        │    KV   │   │   D1    │
        │        │(セッション)│   │(SQLite) │
        │        └─────────┘   └─────────┘
        │              │
        │        ┌─────────┐
        │        │AI Worker│
        │        │(難易度調整)│
        │        └─────────┘
        │
   ┌────┴────────────────────────────┐
   │         開発環境 (WSL2)            │
   │  Node.js 20 + pnpm + VS Code      │
   │  Hermes Agent → コード生成        │
   │  AntiGravity → レビュー/デバッグ   │
   └─────────────────────────────────┘
```

---

## 📋 各環境の役割分担

### 1️⃣ Vercel — **フロントエンド＆ゲーム本体の司令塔**

| 項目 | 内容 |
|------|------|
| **用途** | Next.js + Phaser 3 のホスティング |
| **なぜVercelか** | 日本からのレイテンシ低、Git連携で`git push`だけでデプロイ、プレビュー環境自動生成 |
| **担当** | ゲーム画面、UIコンポーネント、静的アセット配信、ISR（図鑑ページなど） |

```bash
# 技術スタック
Framework: Next.js 14 (App Router)
Game Engine: Phaser 3.70+ (Canvas/WebGL)
Language: TypeScript
Styling: Tailwind CSS + shadcn/ui
Package Manager: pnpm
```

```bash
# WSL2での初期セットアップ
cd /mnt/c/Users/<username>/projects  # Windows側へマウント
npx create-next-app@latest pylori-td --typescript --tailwind --app --no-src-dir
cd pylori-td
pnpm add phaser @types/node
```

---

### 2️⃣ Cloudflare Workers — **バックエンドAPI＆リアルタイム通信**

| 項目 | 内容 |
|------|------|
| **用途** | 服薬記録API、スコア保存、AI難易度調整、マルチプレイ（MVP後） |
| **なぜWorkersか** | エッジ配置で世界最速、無料枠十分、VercelからのAPIコールが超高速 |
| **担当** | セッション管理、服薬コンプライアンス記録、AI推論エンドポイント |

#### Workersで実装するAPIエンドポイント

```typescript
// Cloudflare Workers (Honoフレームワーク推奨)
// routes.ts イメージ

POST /api/drug/take        # 服薬記録
GET  /api/drug/status      # 今日の服薬状況取得
POST /api/score            # スコア保存
GET  /api/leaderboard      # ランキング
POST /api/ai/difficulty    # AI Worker連携（難易度提案）
```

```bash
# WSL2でのWorkers開発環境構築
npm install -g wrangler
wrangler login  # Cloudflare認証
npx create-cloudflare@latest pylori-api --framework=hono
cd pylori-api
wrangler dev    # ローカルエミュレータ起動
```

---

### 3️⃣ Cloudflare KV + D1 — **データ永続化**

| サービス | 用途 | 理由 |
|---------|------|------|
| **KV** | セッションデータ、服薬タイムスタンプ、キャッシュ | キー・バリューで超高速、TTL自動削除可能 |
| **D1** | ユーザープロフィール、スコア履歴、図鑑解放状況 | SQLite互換、SQLで管理しやすい、無料枠5GB |

```sql
-- D1 テーブル設計例
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    session_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drug_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    day INTEGER CHECK(day BETWEEN 1 AND 7),
    taken_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    day INTEGER,
    wave INTEGER,
    score INTEGER,
    cleared BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4️⃣ Cloudflare AI Workers — **AI難易度調整（Phase 2以降）**

| 項目 | 内容 |
|------|------|
| **用途** | プレイヤーの勝率・服薬率に応じた難易度動的調整 |
| **モデル** | `@cf/meta/llama-3-8b-instruct` または Workers AI組み込みモデル |
| **実装** | プレイデータJSONを投げて、次のウェーブパラメータをJSONで受け取る |

```typescript
// Cloudflare AI Worker 実装例
export default {
  async fetch(request, env) {
    const { winRate, drugCompliance, currentDay } = await request.json();
    
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{
        role: 'user',
        content: `プレイヤーの勝率${winRate}%、服薬率${drugCompliance}%。
        ピロリ菌タワーディフェンスのDAY${currentDay}の敵出現数と強さをJSONで提案。
        形式: {"enemyCount": number, "enemyHpMultiplier": number, "specialEnemy": string}`
      }]
    });
    
    return new Response(response.response);
  }
};
```

---

### 5️⃣ LOLIPOP レンタルサーバー — **フォールバック＆バックアップ**

| 項目 | 内容 |
|------|------|
| **用途** | 大容量アセットのミラー、DBバックアップ、メール送信（リマインダー） |
| **なぜ使うか** | PHP/MySQLが動くため、WordPress連携やメール送信が楽。Cloudflareのオリジンとしても可 |
| **担当** | ゲームの重いアセット（BGM/ボイス）の配信、CSVエクスポート機能、管理画面 |

```
LOLIPOP上の構成例
/public_html/pylori-assets/   # BGM, SE, 高解像度画像
/public_html/pylori-admin/    # PHP製スコア管理画面（簡易）
/public_html/pylori-backup/   # D1ダンプの日次バックアップ
```

---

### 6️⃣ WSL2 (Windows 11) — **ローカル開発統合環境**

```bash
# WSL2 Ubuntu 22.04 推奨セットアップ

# 1. 基本ツール
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential

# 2. Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. pnpm (高速パッケージマネージャ)
npm install -g pnpm

# 4. wrangler (Cloudflare Workers CLI)
npm install -g wrangler

# 5. プロジェクトディレクトリ構成
mkdir -p ~/projects/pylori-td
cd ~/projects/pylori-td

# monorepo構成（pnpm workspace）
# packages/
#   ├── web/          # Next.js + Phaser (Vercel)
#   ├── api/          # Hono + Cloudflare Workers
#   ├── ai-worker/    # Cloudflare AI Worker
#   └── shared/       # 型定義・定数共有
```

#### VS Code 推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "phoenisx.cssvar",
    "editorconfig.editorconfig"
  ]
}
```

---

## 🤖 Hermes Agent + AntiGravity 活用ワークフロー

### Phase A：設計 →コード（Hermes Agent）

```
【Hermes Agentへのプロンプト例】

あなたはPhaser 3のエキスパートエンジニアです。
以下の要件で `Enemy.ts` クラスを作成してください：

1. 基底クラス `Enemy` を作成
2. 派生クラス `UreaseTank`（ウレアーゼ特化型）を実装
   - 能力：通過した地点に「中和ゾーン（pH上昇エリア）」を生成
   - 視覚：背中に泡のタンクを持つスプライトアニメーション
3. TypeScript、Phaser 3.70準拠
4. ファイルパス：src/game/objects/Enemy.ts

【出力形式】
- 完全なコード
- 各メソッドのJSDocコメント
```

### Phase B：レビュー＆デバッグ（AntiGravity）

```
【AntiGravityへのプロンプト例】

以下のPhaser 3ゲームループコードをレビューしてください。
パフォーマンスボトルネック、メモリリーク、TypeScript型安全性の問題を指摘し、
修正案を提示してください。

【コード】
（Hermesが生成したコードを貼り付け）
```

### 推奨ワークフロー

| ステップ | 担当AI | 作業内容 |
|---------|--------|---------|
| 1. 設計分解 | あなた | 機能を小さく分割（1ファイル=1責務） |
| 2. コード生成 | **Hermes Agent** | 各ファイルの初版コードを生成 |
| 3. レビュー | **AntiGravity** | 型安全性、パフォーマンス、セキュリティレビュー |
| 4. 手動修正 | あなた | WSL2で実際に動かし、微調整 |
| 5. テスト | あなた + AI | ユニットテスト生成（Hermes）、バグ検出（AntiGravity） |

---

## 🧪 テスト環境構成

### ローカルテスト（WSL2内）

```bash
# ターミナル1：フロントエンド
cd ~/projects/pylori-td/packages/web
pnpm dev        # localhost:3000

# ターミナル2：API（Workersローカルエミュレータ）
cd ~/projects/pylori-td/packages/api
wrangler dev    # localhost:8787

# ターミナル3：AI Worker
cd ~/projects/pylori-td/packages/ai-worker
wrangler dev    # localhost:8788
```

### ステージング環境（自動デプロイ）

| ブランチ | デプロイ先 | 用途 |
|---------|-----------|------|
| `main` | Vercel Production + Workers Production | 本番 |
| `develop` | Vercel Preview + Workers Staging | ステージング |
| `feature/*` | Vercel Preview（自動生成） | 機能レビュー |

```yaml
# .github/workflows/deploy.yml（GitHub Actions例）
name: Deploy
on:
  push:
    branches: [main, develop]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g wrangler
      - run: wrangler deploy --env ${{ github.ref_name == 'main' && 'production' || 'staging' }}
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

---

## 📦 推奨パッケージ構成（package.json）

```json
{
  "name": "pylori-td",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

```json
// packages/web/package.json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "phaser": "^3.80.0",
    "hono": "^4.3.0"  // APIクライアントとしても使用
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

```json
// packages/api/package.json
{
  "dependencies": {
    "hono": "^4.3.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240500.0",
    "wrangler": "^3.57.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 🚀 ハッカソン当日の開発フロー（タイムテーブル例）

| 時間 | 作業 | 使用環境 |
|------|------|---------|
| 0:00-1:00-1:00 | 環境構築、モノレポ初期化 | WSL2 + pnpm |
| 1:00-3:00 | Phaserゲームコア実装（Hermes生成→手動修正） | WSL2 + VS Code |
| 3:00-5:00 | UIコンポーネント（Next.js）実装 | WSL2 + Vercel Preview |
| 5:00-7:00 | Cloudflare Workers API連携 | WSL2 + wrangler dev |
| 7:00-9:00 | 服薬システム＋7DAY進行実装 | WSL2 + KV/D1ローカル |
| 9:00-11:00 | デバッグ＆バランス調整（AntiGravityレビュー） | WSL2 + ブラウザ |
| 11:00-12:00 | Vercel + Workers本番デプロイ | Git push → CI/CD |
| 12:00- | プレゼン準備 | 本番URL確認 |

---

## 💡 環境選定のポイントまとめ

| 悩み | 推奨選択 |
|------|---------|
| 「ゲーム本体をどこに置く？」 | **Vercel**（Next.js + Phaserが最速） |
| 「服薬データをどこに保存？」 | **Cloudflare KV/D1**（無料・高速・Workersと相性◎） |
| 「AI難易度調整は？」 | **Cloudflare AI Worker**（追加インフラ不要） |
| 「重いBGM/画像は？」 | **LOLIPOP**（ストレージ無制限に近い）または **Cloudflare R2** |
| 「ローカルで何を使う？」 | **WSL2 + pnpm + VS Code**（WindowsとLinuxのいいとこ取り） |
| 「AIにどう頼む？」 | **Hermesで生成→AntiGravityでレビュー→手動調整** |

---

この構成であれば、**インフラコストはほぼ無料**（Vercel Hobby + Cloudflare Free Tier + LOLIPOP既存プラン）で収まり、WSL2上で統一的な開発体験が得られます。

何か特定の環境についてさらに深掘りが必要でしたら、お知らせください！