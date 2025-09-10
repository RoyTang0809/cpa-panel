# 115 CPA Online — React 面板（GitHub Pages 版）

這是一個已設定好的 Vite + React + Tailwind 專案，你只需要 **上傳到 GitHub**，就可以用 **GitHub Pages** 自動部署，直接在瀏覽器開。

## 一步步操作（零基礎版本）

### A. 準備檔案
1. 下載本專案的 ZIP 檔，解壓縮。

### B. 建立 GitHub Repository
1. 登入你的 GitHub。
2. 右上角按 `+` → **New repository**。
3. Repository name 可以取名：`cpa-panel`（或任何你喜歡的名稱）。
4. 其他保持預設，按 **Create repository**。

### C. 用網頁上傳（不用安裝任何東西）
1. 進入你剛建立的 Repository 頁面。
2. 按 **Add file** → **Upload files**。
3. 把剛才解壓縮後的所有檔案與資料夾（**不是整個資料夾包起來**）拖曳上去。
4. 滑到最下面，按 **Commit changes**。

### D. 開啟 GitHub Pages（自動部署）
1. 在 Repo 頁面上方，點 **Settings**。
2. 左側選單點 **Pages**。
3. 在 **Build and deployment** → **Source** 選 **GitHub Actions**（有時會自動偵測）。
4. 回到 Repo 的 **Actions** 分頁，可以看到 `Deploy to GitHub Pages` 工作開始跑。
5. 成功後，頁面上會出現一個網址，例如：  
   `https://你的帳號.github.io/cpa-panel`  
   用瀏覽器打開，就能使用面板！ 🎉

> 本專案已把 `vite.config.js` 設為 `base: './'`，因此在 GitHub Pages 的子路徑開啟也能正確載入資源，**不需要改任何設定**。

## 本地開發（選用）
如果你之後想在自己的電腦跑：
```bash
npm install
npm run dev
```
打開終端機顯示的網址（通常 http://localhost:5173）。

---

祝使用順利！

測試 GitHub Pages 部署
