# sho-recruit.jp — 自動デプロイ設定リポジトリ
このリポジトリは **sho-recruit.jp.kzkicw.com**（Xserver）への公開用ソースを管理しています。  
GitHub Actions を使って `develop` ブランチへの push で自動デプロイされます。

## 📦 プロジェクト構成
/
├─ assets/
│ ├─ css/ # SCSSコンパイル後のCSS（CIで生成・Git管理外）
│ ├─ img/ # 画像
│ └─ js/ # JavaScript
├─ src/
│ └─ scss/ # ソース（ここを編集）
├─ inc/ # HTMLの共通パーツ（ヘッダー/フッターなど）
├─ 各個別HTML
├─ index.html
└─ .github/workflows/develop.yml # 自動デプロイ設定

## デプロイについて
- `develop` ブランチに push すると、自動的に Xserver へ FTPS アップロードされます。  
- Actions のワークフローは `.github/workflows/develop.yml` に定義されています。  
- デプロイ先パス：  
  `/kzkicw.com/public_html/sho-recruit.jp.kzkicw.com/`

## ローカルでの環境構築とデプロイ手順

1. **環境作成**
   - メールで招待された GitHub リポジトリを clone  
     ```bash
     git clone git@github.com:kouichi-kuze/sho-recruit.jp.git
     ```
   - `develop` ブランチをチェックアウト  
     ```bash
     git checkout develop
     ```
   - 作業ブランチを作成  
     ```bash
     git checkout -b feature/xxxx
     ```

2. **開発後**
   - 変更をコミットして push  
     ```bash
     git add .
     git commit -m "コミット名"
     git push origin feature/xxxx

3. **プルリクエスト（Pull Request）**
   - GitHub 上で  
     `feature/xxxx` → `develop` へ Pull Request を作成  
   - レビュー・マージ後、  
     GitHub Actions により **自動で Xserver にデプロイ** されます。

## ブランチ命名ルール（例）
  feature/	新機能・改修・ページ追加など	feature/add-about-page, feature/update-header-style
  fix/	バグ修正	fix/sp-menu-toggle, fix/footer-link
  hotfix/	緊急修正（本番に直接反映する場合）	hotfix/typo-in-title
  release/	リリース準備（バージョンタグ用）	release/1.0.0
  docs/	ドキュメント更新のみ	docs/update-readme


## テストURL情報
URL	https://sho-recruit.jp.kzkicw.com/
ユーザー名	user
パスワード	87drxdtttptd
  
  
  
## 構造化データ（JSON-LD）設置ルール
下記を必要なページに設置
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": "xxxxx",
  "name": "xxxxx",
  "description": "xxxxx"
}
</script>

## ページ	推奨スキーマタイプ
TOP：Organization + WebSite（必要なら FAQPage も）
仕事を知る（一覧）：ItemList（インタビュー一覧）
インタビュー詳細：Article（Google の対応範囲が広い）
FAQ：TOP内の見出しセクションに FAQPage を含めるのは可（最近は表示率低め）

## 備考
assets/css/ は Git 管理外（CI が SCSS から生成し、サーバーへアップ）。
.ftp-deploy-sync-state.json は差分アップロード用。サーバー上から削除しないこと。
大容量ファイル（動画など）は CI から除外している場合があります。必要に応じて手動でアップしてください。


## 🎨 キービジュアル（THREE.js 担当者さん向け）
作業担当者は以下のファイルをベースに作業してください。

- HTML：`inc/hero.html`
- SCSS：`src/scss/layouts/_kv.scss`
- JS（読み込み設定）：`inc/heroscript.html`
- JS（実装本体）：`assets/js/hero.js`

> これらのファイルを基本として作業を進めてください。  
> ただし、構成が使いづらい・拡張が必要な場合は、**自由に新規ファイルを作成／分割しても問題ありません。**  
> （例：`assets/js/modules/hero/` を追加するなど）

新たにスクリプトファイルを追加した場合は、  
**`inc/heroscript.html` に読み込みタグ（`<script>`）を追記**してください。  
必要に応じて、コンポーネント構成や命名ルールの提案も歓迎です。


