# 🚀 ピロリ菌除菌タワーディフェンス — 具体的な開発進行計画

前回の設計書＆環境構成を基に、**実際に手を動かす段階での進め方**を提案します。  
「何から始めて、何を並行で進めて、どこで確認するか」をステップ化しています。

---

## 🗺️ 全体ロードマップ（4フェーズ）

```
【Phase 0】準備と骨格構築（半日〜1日）
【Phase 1】ゲームコア単体完成（1〜2日）
【Phase 2】Web連携＆服薬システム（1日）
【Phase 3】統合・デバッグ・リリース（半日）
```

---

## Phase 0：準備と骨格構築（Day 0）

### 0-1. WSL2上にモノレポを構築

```bash
# WSL2内で実行
mkdir -p ~/projects/pylori-td && cd ~/projects/pylori-td

# pnpm workspace初期化
pnpm init
mkdir packages
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF

# 3つのパッケージを同時作成
mkdir -p packages/{web,api,shared}
cd packages/web && pnpm init && cd ../..
cd packages/api && pnpm init && cd ../..
cd packages/shared && pnpm init && cd ../..

# 共有型定義パッケージを先に整える
cd packages/shared
pnpm add -D typescript
cat > tsconfig.json << 'EOF'
{"compilerOptions":{"target":"ES2022","module":"ESNext","declaration":true,"outDir":"dist"}}
EOF
mkdir src && cat > src/types.ts << 'EOF'
// ゲーム内で使う共通型
export interface EnemyConfig {
  id: string;
  hp: number;
  speed: number;
  type: 'scout' | 'urease' | 'cagA' | 'vacA';
  skill?: string;
}

export interface TowerConfig {
  id: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  type: 'acid' | 'antibiotic' | 'barrier' | 'lacto';
}

export interface WaveConfig {
  day: number;
  wave: number;
  enemies: { type: string; count: number; interval: number }[];
}

export interface DrugLog {
  userId: string;
  day: number;
  slot: 'morning' | 'noon' | 'evening' | 'night';
  takenAt: string;
}
EOF
pnpm exec tsc
cd ../..
```

### 0-2. 各パッケージの雛形をAIに生成させる

**Hermes Agentへの依頼順（依存関係を考慮）**

| 順番 | 依頼内容 | 出力先 |
|------|---------|--------|
| 1 | `shared` の型定義と定数（敵パラメータ、タワーパラメータ、ウェーブ定義JSONスキーマ） | `packages/shared/src/` |
| 2 | `web` のNext.js + Phaser初期設定（ゲームキャンバスをReactコンポーネント内に埋め込む構成） | `packages/web/` |
| 3 | `api` のHono + Cloudflare Workers初期設定（CORS対応、ヘルスチェックエンドポイント） | `packages/api/` |

```text
【Hermes Agentへのプロンプト例：web雛形】

WSL2上の ~/projects/pylori-td/packages/web/ に、
Next.js 14 App Router + Phaser 3.80 + TypeScript の雛形を作成してください。

要件：
1. app/page.tsx で 800x600 のゲームキャンバスを表示
2. app/game/GameCanvas.tsx で Phaser.Game をuseEffect内で初期化
3. src/game/scenes/BootScene.ts、MenuScene.ts、GameScene.ts の3シーンを作成
4. GameScene はプレースホルダー（黒背景に「DAY 1」と表示するだけ）
5. Tailwind CSSでキャンバスを中央寄せ
6. 型は ../shared/dist/types を参照

出力は完全なファイル内容を提示してください。
```

### 0-3. 静的アセットの確保（並行作業）

画像・音響は**プログラミングと並行**で準備。ハッカソンでは**仮素材（プレースホルダー）先行**が鉄則。

```bash
# 仮素材用ディレクトリ
mkdir -p packages/web/public/assets/{images,audio,tilemaps}

# 仮素材を先に配置（後で差し替え）
# - 敵：色違いの円（赤=スカウト、青=ウレアーゼ、紫=CagA）
# - タワー：四角（緑=胃酸、黄=抗生、灰=バリア）
# - BGM：無音 or フリー素材1曲
```

> 💡 **コツ**：見た目は仮でも「動くもの」を最優先。アセットはPhase 3で本格化。

---

## Phase 1：ゲームコア単体完成（Day 1-2）

### 1-1. ゲームループの実装（Phaser側）

**実装順序（依存の少ない順）**

```
① マップ/経路描画（敵が通る道を可視化）
② 敵基底クラス + 2種（スカウト、ウレアーゼ）
③ タワー基底クラス + 2種（胃酸、抗生）
④ 弾/攻撃判定
⑤ ウェーブマネージャー（敵を時間差で出現）
⑥ 胃酸中和ギミック（ウレアーゼゾーン）
⑦ UI（HP、ATP、DAY表示）
```

**Hermes Agentの使い方**

```text
【依頼例：敵クラス】

~/projects/pylori-td/packages/web/src/game/objects/Enemy.ts に、
Phaser 3の敵基底クラスを作成。

- 経路（Waypoint配列）を受け取り、順番に移動
- hpが0になったらdestroy
- ウレアーゼ型（UreaseTank）は、移動中に中和ゾーン（円形エリア）を生成
- 中和ゾーンは AcidZone クラスとして別ファイルで管理
- TypeScript厳格モード

敵パラメータは packages/shared/src/enemies.ts から import。
```

**AntiGravityのレビュータイミング**

- **1ファイル完成ごと**にAntiGravityに「型安全性・メモリリーク・パフォーマンス」をレビューさせる
- 特に `update()` ループ内の無駄な処理を指摘させる

### 1-2. ローカルテストループ

```bash
# ターミナル1（WSL2）
cd ~/projects/pylori-td/packages/web
pnpm dev

# ブラウザで http://localhost:3000 を確認
# ゲームキャンバスが表示され、敵が動くことを目視確認
```

**確認チェックリスト（Phase 1終了基準）**

- [ ] 敵が経路を通り抜ける
- [ ] タワーが敵を自動追尾して攻撃
- [ ] 敵HP0で消滅、プレイヤーにATP加算
- [ ] ウレアーゼ型が中和ゾーンを生成し、タワー攻撃力が低下
- [ ] 上皮細胞（最終防衛線）に敵が到達するとHP減少
- [ ] HP0でゲームオーバー画面

---

## Phase 2：Web連携＆服薬システム（Day 2-3）

### 2-1. Cloudflare Workers API実装

```bash
# ターミナル2（WSL2、別セッション）
cd ~/projects/pylori-td/packages/api
wrangler dev  # localhost:8787
```

**実装順序**

```
① ヘルスチェック GET /health
② 服薬記録 POST /api/drug/take（KV保存）
③ 服薬状況 GET /api/drug/status（KV読み出し）
④ スコア保存 POST /api/score（D1保存）
⑤ 7DAY進行データ GET /api/progress
```

**Hermes Agentへの依頼例**

```text
packages/api/src/index.ts に Hono アプリを作成。

エンドポイント：
- POST /api/drug/take
  Body: { userId: string, day: number, slot: string }
  処理: Cloudflare KVに { userId_day_slot: ISOタイムスタンプ } を保存
  レスポンス: { success: true, nextSlot: string, comboCount: number }

- GET /api/drug/status?userId=xxx&day=3
  処理: KVから当日の4スロット分を取得
  レスポンス: { day: 3, slots: { morning: true, noon: false, ... } }

CORSは packages/web (localhost:3000 / vercel.app) を許可。
```

### 2-2. フロントエンドからAPI呼び出し

```bash
# web側にHonoクライアントを追加
cd packages/web
pnpm add hono  # RPCクライアントとして使用
```

**連携フロー**

```
1. ゲーム内「薬を飲む」ボタン押下
2. fetch('/api/drug/take', { method: 'POST', ... })
3. 成功 → コンボボーナス発動（全タワー攻撃速度UP）
4. 失敗 → アラート表示
```

### 2-3. 服薬コンプライアンスをゲームに反映

| ゲーム内イベント | API連携 | 効果 |
|----------------|--------|------|
| 「朝の服薬」ボタン | POST /api/drug/take | 全タワー 30秒間 1.5倍攻撃 |
| 服薬忘れ（タイムアウト） | 自動判定 | 次ウェーブの敵HP 1.2倍 |
| 7日間フルコンプライアンス | KVから集計 | 最終日に必殺技解放 |

---

## Phase 3：統合・デバッグ・リリース（Day 3-4）

### 3-1. 統合テストシナリオ

```bash
# ローカルで全サービス起動
# ターミナル1
cd packages/web && pnpm dev      # :3000
# ターミナル2  
cd packages/api && wrangler dev  # :8787
```

**テスト手順**

1. **ゲーム開始** → DAY 1、WAVE 1が正常に開始
2. **タワー配置** → ATP消費、敵を撃破
3. **ウレアーゼ出現** → 中和ゾーン生成、胃酸タワー弱体化確認
4. **服薬ボタン** → APIコール成功、KVに記録、ゲーム内ボーナス確認
5. **DAY進行** → WAVEクリア後、DAY 2に移行、敵が強化される確認
6. **ゲームオーバー** → 上皮細胞全滅でリザルト、教育メッセージ表示

### 3-2. 本番デプロイ

```bash
# 1. API（Cloudflare Workers）
cd packages/api
wrangler deploy --env production

# 2. Web（Vercel）
cd packages/web
# GitHubにpushするとVercelが自動デプロイ
# またはCLI
pnpm dlx vercel --prod
```

**デプロイ後の検証**

- VercelのURLでゲームが開く
- ブラウザDevTools → Network → APIコールが200を返す
- Cloudflare Dashboard → KVでデータが保存されている

### 3-3. LOLIPOP活用（アセット配信）

```bash
# 重いアセット（BGM、ボイス）をLOLIPOPに配置
# LOLIPOPのFTPへアップロード
# /public_html/pylori/assets/bgm/

# ゲームコード内で参照
const BGM_URL = 'https://your-lolipop-domain.com/pylori/assets/bgm/stage1.mp3';
```

---

## 🤖 AI活用の詳細ワークフロー

### Hermes Agent：「生成担当」

**使いどころ**
- 新規ファイルの骨格作成
- JSONデータ（敵パラメータ、ウェーブ定義）の生成
- ボイラープレートコード（APIエンドポイント、Reactコンポーネント）

**効率化のコツ**
```
「ファイルパス、技術スタック、入出力の型、制約」を必ず含める。
→ 修正回数を減らせる
```

### AntiGravity：「レビュー担当」

**使いどころ**
- Hermesが生成したコードの**型安全性チェック**
- `update()` ループの**パフォーマンス指摘**
- **セキュリティ**：APIの入力バリデーション漏れ

**効率化のコツ**
```
「このコードの問題点を3つ挙げて、修正案も提示してください」
→ 箇条書きで返ってくるので修正が速い
```

### 並行活用の例（1日のサイクル）

```
09:00  Hermes → Enemy.ts 生成
09:15  AntiGravity → Enemy.ts レビュー
09:30  あなた → レビュー指摘を反映、ローカルテスト
10:00  Hermes → Tower.ts 生成
10:15  AntiGravity → Tower.ts レビュー
...
```

---

## 📅 ハッカソン想定：3日間スケジュール

| 時間 | Day 1 | Day 2 | Day 3 |
|------|-------|-------|-------|
| **AM** | Phase 0: 環境構築、雛形生成、仮素材準備 | Phase 1: タワー＆敵3種実装、攻撃判定 | Phase 2: API連携、服薬システム、7DAY進行 |
| **PM** | Phase 0: マップ描画、敵移動、ウェーブ制御 | Phase 1: 胃酸中和ギミック、UI実装、スコア | Phase 3: 統合テスト、本番デプロイ、プレゼン準備 |
| **夜** | ローカルテスト：敵が動く確認 | ローカルテスト：ゲームループ完走確認 | 本番URL検証、デモ動画撮影 |

---

## 🎯 進行中の「困った時」の対処法

| 症状 | 対処 |
|------|------|
| **PhaserがReactで動かない** | `useEffect` 内で `new Phaser.Game()` を作成。クリーンアップで `game.destroy(true)` を必ず呼ぶ。 |
| **Workers APIがCORSエラー** | Honoの `app.use(cors({ origin: '*' }))` を最初に設定。本番ではVercelドメインに絞る。 |
| **KVに保存されない** | `wrangler dev` 時は `--local` フラグでローカルKVを使用。本番では `wrangler kv:namespace create` が必要。 |
| **ゲームが重い** | AntiGravityに「このupdateループを最適化して」と依頼。オブジェクトプーリングを提案させる。 |
| **7日間のテストが現実的に無理** | ゲーム内時間を**1日=10分**に圧縮するデバッグモードを作る。`?debug=1` で即座にDAY 7にジャンプ。 |

---

## ✅ 今すぐ始めるべき「最初の3コマンド」

```bash
# WSL2で実行
mkdir -p ~/projects/pylori-td && cd ~/projects/pylori-td
git init  # 最初からGit管理
code .    # VS Code起動
```

その後、**Hermes Agentに「pnpm workspaceのモノレポ雛形を生成して」と依頼**するのが最短です。

---

この進行計画で、**Day 1の終わりには「敵が動く画面」、Day 2の終わりには「タワーで撃てるゲーム」、Day 3の終わりには「服薬連携付きの完成品」**が目指せます。

まずは **Phase 0のモノレポ構築**から始めましょう。必要であれば、最初の `pnpm-workspace.yaml` と各 `package.json` の雛形をここで生成することもできます。どうしますか？