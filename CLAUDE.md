# SQL Client Desktop App - プロジェクトコンテキスト

## プロジェクト概要

A5:SQL Mk-2のクロスプラットフォーム完全代替を目指すデスクトップSQLクライアント。
Windows専用のA5をMac / Linux / Windowsで動作させることが最大の目的。

---

## 技術スタック

```
デスクトップフレームワーク : Electron
フロントエンド             : React + TypeScript
ビルドツール               : Vite
SQLエディタ               : Monaco Editor
結果テーブル               : AG Grid (Community)
スタイリング               : Tailwind CSS
DB接続 (Node.js)          :
  ├ SQLite   → better-sqlite3
  ├ MySQL    → mysql2
  └ PostgreSQL → pg
設定・接続情報保存          : electron-store
SQLフォーマッター           : sql-formatter
ER図                      : Mermaid.js
パッケージマネージャー       : pnpm
```

---

## 対応OS

- Windows
- macOS
- Linux

---

## 対応DB

- SQLite
- MySQL / MariaDB
- PostgreSQL

---

## ディレクトリ構成

```
project-root/
　├ src/
　│　├ main/                   # Electronメインプロセス
　│　│　├ index.ts             # エントリーポイント
　│　│　├ ipc/                 # IPCハンドラー
　│　│　│　├ connection.ts     # DB接続管理
　│　│　│　├ query.ts          # SQL実行
　│　│　│　└ schema.ts         # スキーマ取得
　│　│　└ db/                  # DB接続ロジック
　│　│　　　├ index.ts         # DB接続ファクトリー
　│　│　　　├ sqlite.ts        # SQLite接続
　│　│　　　├ mysql.ts         # MySQL接続
　│　│　　　└ postgres.ts      # PostgreSQL接続
　│　│
　│　└ renderer/               # Reactフロントエンド
　│　　　├ App.tsx
　│　　　├ components/
　│　　　│　├ Sidebar/         # テーブルツリー
　│　　　│　├ Editor/          # Monaco Editorラッパー
　│　　　│　├ ResultGrid/      # AG Grid結果テーブル
　│　　　│　└ ConnectionModal/ # 接続設定モーダル
　│　　　├ hooks/
　│　　　│　├ useConnection.ts
　│　　　│　└ useQuery.ts
　│　　　└ store/              # 状態管理（Zustand）
　│
　├ electron-builder.yml       # ビルド設定
　├ vite.config.ts
　├ tsconfig.json
　└ package.json
```

---

## 実装すべき機能一覧

### Phase 1 - MVP（最初に作る）

- [ ] Electronプロジェクト初期セットアップ
- [ ] DB接続設定画面（ホスト・ポート・ユーザー・パスワード・DB名）
- [ ] 複数接続の保存・切り替え
- [ ] テーブルツリー表示（左サイドバー）
- [ ] Monaco EditorによるSQLエディタ
- [ ] SQL実行（Ctrl+Enter）
- [ ] AG Gridによる結果テーブル表示
- [ ] エラーメッセージ表示

### Phase 2 - 使いやすさ向上

- [ ] SQLキーワード・テーブル名・カラム名の予測変換（オートコンプリート）
- [ ] SQLフォーマッター（sql-formatter）
- [ ] 実行履歴
- [ ] 結果のCSVエクスポート
- [ ] タブ管理（複数クエリを同時編集）
- [ ] カラム情報表示（型・制約など）

### Phase 3 - 差別化機能

- [ ] ER図表示（Mermaid.js）
- [ ] 実行計画（EXPLAIN）の可視化
- [ ] ダークモード / ライトモード切り替え
- [ ] AI補完（Claude API連携）

---

## アーキテクチャの重要原則

### メインプロセスとレンダラーの分離

```
レンダラー（React）
　↓ ipcRenderer.invoke('execute-query', { sql, connectionId })
メインプロセス（Node.js）
　↓ DB接続・SQL実行
　↓ ipcMain.handle('execute-query', handler)
レンダラーに結果を返す
```

**DB接続は必ずメインプロセスで行う。**
レンダラーで直接DB接続するとUIがブロックされるため厳禁。

### IPC通信チャンネル一覧

```
connection:save     # 接続情報を保存
connection:list     # 接続一覧を取得
connection:delete   # 接続を削除
connection:test     # 接続テスト
schema:tables       # テーブル一覧取得
schema:columns      # カラム情報取得
query:execute       # SQL実行
query:history       # 実行履歴取得
```

---

## DB接続実装方針

### 接続ファクトリーパターン

```typescript
// src/main/db/index.ts
export function createConnection(config: ConnectionConfig) {
  switch (config.type) {
    case "sqlite":
      return new SQLiteConnection(config);
    case "mysql":
      return new MySQLConnection(config);
    case "postgresql":
      return new PostgreSQLConnection(config);
  }
}
```

### 接続情報の保存

```typescript
// electron-storeで暗号化して保存
// パスワードはelectron.safeStorageで暗号化
import Store from "electron-store";
const store = new Store({ encryptionKey: "your-key" });
```

---

## Monaco Editor 設定方針

```typescript
// SQLオートコンプリート登録
monaco.languages.registerCompletionItemProvider("sql", {
  provideCompletionItems: (model, position) => {
    // 1. SQLキーワード（SELECT, WHERE, JOIN等）
    // 2. 接続中DBのテーブル名
    // 3. 選択テーブルのカラム名
    return { suggestions: [...keywords, ...tables, ...columns] };
  },
});
```

---

## パフォーマンス方針

- 大量データ表示はAG Gridの仮想スクロールで対応
- SQL実行は非同期（async/await）でUIをブロックしない
- 結果が10,000行を超える場合はページネーション or 上限表示
- DB接続はコネクションプールを使用

---

## ビルド・配布

```bash
# 開発
pnpm dev

# ビルド（全OS）
pnpm build

# パッケージング
pnpm package
```

electron-builderで各OS向けにパッケージング：

- Windows: `.exe` (NSIS installer)
- macOS: `.dmg`
- Linux: `.AppImage`

---

## 開発の進め方（Claude Codeへの指示）

以下の順序で実装を進めること：

1. `pnpm create electron-vite` でプロジェクト作成（React + TypeScript テンプレート）
2. 依存パッケージのインストール（`pnpm install`）
3. メインプロセスのIPC基盤を作る
4. DB接続ロジック（SQLite → MySQL → PostgreSQL の順）
5. Reactコンポーネントの実装（接続モーダル → サイドバー → エディタ → 結果グリッド）
6. Monaco Editorのオートコンプリート設定
7. 動作確認・デバッグ

---

## 参考にするOSS

- **Beekeeper Studio**（MIT）: UIレイアウトの参考
- **DBeaver**: 機能セットの参考
- **Drizzle Studio**: モダンなUIデザインの参考

---

## 注意事項

- `nodeIntegration: false`, `contextIsolation: true` を必ず守る（セキュリティ）
- preload.tsでipcRendererをexposeする
- 接続パスワードは平文保存禁止（electron.safeStorage使用）
- DB接続エラーは必ずユーザーにわかりやすく表示する
