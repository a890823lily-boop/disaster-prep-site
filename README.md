# 防災資訊網 disaster-prep-site

### 👉 [開啟網站：a890823lily-boop.github.io/disaster-prep-site](https://a890823lily-boop.github.io/disaster-prep-site/)

用 iPhone Safari 開啟後，點「分享」→「加入主畫面」即可安裝成 APP。

簡潔、適合手機瀏覽的防災資訊網站，使用純 HTML、CSS、JavaScript 製作，不需安裝任何套件。

## 內容

- **首頁簡介**：防災觀念與快速入口
- **緊急聯絡電話**：119、110、112、1991 等，手機點選即可撥號
- **防災包清單**：可勾選，顯示準備進度，勾選紀錄自動存於瀏覽器（localStorage）
- **地震應變步驟**：趴下・掩護・穩住，分「平時準備／地震當下／地震過後」三個分頁
- **情境挑戰**：6 個動畫情境題（客廳、廚房、電梯、街道、瓦斯外洩、開車），限時作答，選擇後播放結果動畫並附解說

## 使用方式

直接用瀏覽器開啟 `index.html` 即可瀏覽，也可部署到 GitHub Pages 等靜態網站服務。

## 安裝成 APP（PWA）

網站部署到 HTTPS 網址（例如 GitHub Pages）後，可以安裝到手機主畫面，開過一次之後沒有網路也能使用。

- **Android（Chrome）**：開啟網站後點頁面上的「安裝」按鈕，或從瀏覽器選單選「安裝應用程式」
- **iPhone / iPad（Safari）**：點下方「分享」按鈕 →「加入主畫面」

> 用 `file://` 直接開啟時無法使用離線功能；本機測試請用 `python3 -m http.server` 等方式啟動伺服器。
>
> 修改網站內容後，請把 `sw.js` 裡的 `CACHE_NAME` 版本號加一（例如 `v1` → `v2`），讓已安裝的使用者更新快取。

## 檔案結構

```
index.html      頁面內容
css/style.css   樣式（含手機版、深色模式）
js/main.js      選單、防災包清單、分頁、PWA 安裝
js/quiz.js      情境挑戰（題目資料與 SVG 動畫場景）
manifest.webmanifest  APP 名稱、圖示、主題色
sw.js           Service Worker（離線快取）
icons/          APP 圖示
```
