# VSPO Clip Collector V8.0 規格書

## 1. 專案概述

本文件詳細記錄了 VSPO Clip Collector V8.0 版本 (基於 `vspo_clip_collector-8.0/vspo_clip_collector-8.0/index.html`) 的功能、元件實現、判斷流程、背景參數設定及相關依賴支援。此版本是一個單頁應用程式 (SPA)，主要用於收集和展示 VSPO 成員的中文精華影片。

## 2. 技術棧與依賴

*   **HTML5**: 頁面結構。
*   **CSS3**: 頁面樣式，主要透過 Tailwind CSS 框架實現。
*   **JavaScript (ES6+)**: 核心邏輯、資料處理、UI 渲染及事件處理。
*   **Tailwind CSS (CDN)**: 快速構建響應式 UI 的實用工具集框架。
    *   `https://cdn.tailwindcss.com`
*   **YouTube Data API (透過代理伺服器)**: 獲取影片、頻道資訊。
*   **Local Storage**: 用於儲存使用者黑名單設定。
*   **GitHub API**: 用於檢查應用程式更新。

## 3. HTML 結構與 CSS 樣式

### 3.1 HTML 結構 (`index.html`)

*   **基本結構**: 標準 HTML5 骨架，包含 `head` 和 `body`。
*   **響應式設計**: `<meta name="viewport">` 設定確保在不同設備上的良好顯示。
*   **標題**: `<title>` 顯示「れなち的VSPO中文精華收集處」。
*   **應用程式根元素**: `<div id="app"></div>` 作為 JavaScript 動態渲染內容的掛載點。
*   **JavaScript 引入**: `<script type="module">` 標籤引入主要的應用程式邏輯。

### 3.2 CSS 樣式 (內聯 `<style>` 標籤)

*   **全域樣式**:
    *   `html`: `scroll-behavior: smooth;` 提供平滑滾動效果。
    *   `body`: `background-color: #111827;` (深灰色背景), `text-white`, `font-sans` (白色文字，無襯線字體)。
*   **Tooltip 樣式**:
    *   `.tooltip`: 相對定位的容器。
    *   `.tooltiptext`: 隱藏的提示框，在 `:hover` 或 `:focus-within` 時可見。包含背景色 (`#1f2937`), 文字顏色 (`#fff`), 圓角, 內邊距, 絕對定位, `z-index`, 透明度過渡, 邊框 (`#4b5563`), 陰影。
    *   `.tooltiptext::after`: 提示框下方的箭頭。
*   **按鈕樣式**:
    *   `.tab-btn`: 通用按鈕樣式，用於切換視圖（最新/一個月內）。包含內邊距, 圓角, 背景色 (`#374151`), 文字顏色 (`#d1d5db`), 背景色過渡。
    *   `.tab-btn.active, .tab-btn:hover`: 活躍或懸停時的樣式，背景色變為 `#4f46e5` (紫色), 文字顏色變為 `#fff`。
    *   `.pagination-btn`: 分頁按鈕樣式。包含最小寬度, 內邊距, 邊框, 背景色, 文字顏色, 圓角, 過渡, 文字居中。
    *   `.pagination-btn:hover:not(:disabled)`: 懸停時背景色變為 `#4f46e5`。
    *   `.pagination-btn.active`: 活躍時背景色變為 `#4f46e5`, 文字顏色變為 `#fff`, 邊框顏色變為 `#4f46e5`。
    *   `.pagination-btn:disabled`: 禁用時透明度降低, 指標變為 `not-allowed`。
    *   `.pagination-ellipsis`: 分頁省略號樣式。
*   **成員篩選標籤樣式**:
    *   `.filter-btn`: 篩選按鈕樣式。包含 flex 佈局, 內邊距, 圓角, 字重, 變形和陰影過渡, 邊框, 不換行。
    *   `.filter-btn:hover`: 懸停時放大 1.03 倍。
    *   `.filter-btn[data-filter="all"]`: 「顯示全部」按鈕的特定背景色 (`#4b5563`) 和文字顏色 (`#ffffff`)。
    *   `.filter-btn[data-filter="all"].active`: 「顯示全部」按鈕活躍時的背景色 (`#6366f1`) 和陰影。
    *   `.filter-btn.active`: 活躍時的陰影和輕微放大。
*   **滾動條隱藏**:
    *   `.no-scrollbar`: 隱藏 Webkit 瀏覽器和 IE/Edge 的滾動條，並設定 Firefox 的滾動條寬度為 `none`。
*   **Modal 樣式**:
    *   `.modal-overlay`: 固定定位的全屏遮罩，背景半透明黑色，flex 居中內容，初始透明度為 0 且不響應指標事件，有透明度過渡。
    *   `.modal-overlay.visible`: 遮罩可見時透明度為 1 且響應指標事件。
    *   `.modal-content`: 模態框內容樣式。包含背景色 (`#1f2937`), 內邊距, 圓角, 邊框 (`#4b5563`), 陰影, 最大寬度, 初始縮放 0.95，有變形過渡。
    *   `.modal-overlay.visible .modal-content`: 模態框可見時縮放為 1。

## 4. JavaScript 全域變數與狀態管理

### 4.1 全域常數

*   `CURRENT_APP_VERSION`: `V8.0` - 當前應用程式版本。
*   `PROXY_ENDPOINT`: `https://vspo-proxy-git-main-renas-projects-c8ce958b.vercel.app` - 用於獲取 YouTube 資料的代理伺服器端點。
*   `BLACKLIST_KEY`: `vspo_channel_blacklist` - 用於 Local Storage 儲存黑名單的鍵名。

### 4.2 狀態物件 (`state`)

`state` 物件管理應用程式的動態數據和 UI 狀態：

*   `allVideos`: `Array` - 從代理伺服器獲取的所有影片數據。
*   `blacklist`: `Array` - 使用者設定的頻道黑名單。
*   `isLoading`: `Boolean` - 指示資料是否正在載入。
*   `lastUpdated`: `Date` - 資料最後更新時間。
*   `apiError`: `String` - API 請求錯誤訊息。
*   `totalVisits`: `Number` - 總訪問人次。
*   `todayVisits`: `Number` - 今日訪問人次。
*   `activeView`: `String` - 當前活躍的影片顯示模式 (`'latest'` 或 `'all'`)。
*   `currentPage`: `Number` - 當前分頁頁碼 (用於 `'all'` 視圖)。
*   `itemsPerPage`: `Number` - 每頁顯示的影片數量 (固定為 10)。
*   `activeMemberFilter`: `String` - 當前活躍的成員篩選關鍵字 (`'all'` 或特定成員的 `filter_keyword`)。
*   `activeChannelFilter`: `Object` - 當前活躍的頻道篩選物件 (`{ id: String, name: String }` 或 `null`)。

### 4.3 VSPO 成員資料

*   `vspoJPMembers`: `Array<Object>` - 包含 VSPO 日本成員的數據，每個成員物件包含 `name_jp` (日文名), `filter_keyword` (篩選關鍵字), `color` (代表色)。
*   `otherMemberGroups`: `Object` - 包含 VSPO! EN 和 VSPO! CN 成員的數據，結構類似 `vspoJPMembers`，額外包含 `forceWhiteText` 屬性。
*   `allMembers`: `Array<Object>` - 結合了所有 VSPO 成員的扁平化陣列。

## 5. 黑名單管理功能

### 5.1 `getBlacklist()`

*   **功能**: 從瀏覽器的 Local Storage 中讀取黑名單。
*   **流程**:
    1.  嘗試從 `localStorage` 中獲取 `BLACKLIST_KEY` 對應的值。
    2.  如果存在，解析為 JSON 物件並返回。
    3.  如果不存在或解析失敗，返回空陣列 `[]` 並在控制台輸出錯誤。

### 5.2 `saveBlacklist(blacklist)`

*   **功能**: 將黑名單儲存到瀏覽器的 Local Storage 中。
*   **流程**:
    1.  將傳入的 `blacklist` 陣列轉換為 JSON 字串。
    2.  嘗試將 JSON 字串儲存到 `localStorage` 中，鍵名為 `BLACKLIST_KEY`。
    3.  如果儲存失敗，在控制台輸出錯誤。

### 5.3 `addToBlacklist(channel)`

*   **功能**: 將指定頻道添加到黑名單。
*   **參數**: `channel` (Object) - 包含 `id` 和 `name` 的頻道物件。
*   **流程**:
    1.  獲取當前黑名單。
    2.  檢查要添加的頻道是否已存在於黑名單中。
    3.  如果不存在，創建新的黑名單陣列 (包含原黑名單和新頻道)。
    4.  儲存新的黑名單。
    5.  更新 `state.blacklist`。
    6.  呼叫 `render()` 重新渲染頁面以應用黑名單篩選。
    7.  呼叫 `showBlacklistModal()` 重新打開黑名單管理模態框以更新列表顯示。

### 5.4 `removeFromBlacklist(channelId)`

*   **功能**: 從黑名單中移除指定頻道。
*   **參數**: `channelId` (String) - 要移除的頻道 ID。
*   **流程**:
    1.  獲取當前黑名單。
    2.  過濾黑名單，移除 `channelId` 匹配的頻道，創建新的黑名單陣列。
    3.  儲存新的黑名單。
    4.  更新 `state.blacklist`。
    5.  呼叫 `render()` 重新渲染頁面以應用黑名單篩選。
    6.  呼叫 `showBlacklistModal()` 重新打開黑名單管理模態框以更新列表顯示。

### 5.5 `showBlacklistModal()`

*   **功能**: 顯示黑名單管理模態框。
*   **流程**:
    1.  如果已存在黑名單模態框，則先移除。
    2.  創建一個新的 `div` 元素作為模態框遮罩 (`modal-overlay`)，並添加 `visible` 類使其顯示。
    3.  獲取當前黑名單和所有頻道列表 (從 `state.allVideos` 中提取唯一頻道)。
    4.  生成已封鎖頻道列表的 HTML (`blockedListHTML`)。
    5.  生成可供封鎖的頻道下拉選單的 HTML (`channelsToBlock`)。
    6.  將模態框內容 (`modal-content`) 注入到遮罩中，包含標題、已封鎖清單、新增封鎖區塊和關閉按鈕。
    7.  將模態框遮罩添加到 `document.body`。
    8.  **事件監聽**:
        *   點擊遮罩或「關閉」按鈕時，隱藏模態框並在過渡結束後移除。
        *   點擊「封鎖」按鈕時，獲取選中的頻道 ID 和名稱，呼叫 `addToBlacklist()`。
        *   點擊「解除封鎖」按鈕時，獲取頻道 ID，呼叫 `removeFromBlacklist()`。

## 6. 更新檢查相關函式

### 6.1 `isWebView()`

*   **功能**: 判斷當前環境是否為 WebView (例如 Android App 內嵌瀏覽器)。
*   **流程**:
    1.  獲取 `navigator.userAgent` 並轉換為小寫。
    2.  檢查 `userAgent` 是否包含 `'wv'` 字串。

### 6.2 `showUpdateModal(title, message, showDownloadButton = false)`

*   **功能**: 顯示更新提示模態框。
*   **參數**:
    *   `title` (String): 模態框標題。
    *   `message` (String): 模態框內容訊息 (支援 HTML)。
    *   `showDownloadButton` (Boolean): 是否顯示下載按鈕 (預設 `false`)。
*   **流程**:
    1.  如果已存在更新模態框，則先移除。
    2.  創建一個新的 `div` 元素作為模態框遮罩 (`modal-overlay`)。
    3.  根據 `showDownloadButton` 和 `isWebView()` 的結果，生成不同的下載按鈕 HTML。
        *   如果是 WebView，顯示複製網址的輸入框。
        *   如果不是 WebView，顯示直接跳轉到 GitHub Releases 頁面的連結。
    4.  將模態框內容注入到遮罩中，包含標題、訊息、下載按鈕 (如果顯示) 和關閉按鈕。
    5.  將模態框遮罩添加到 `document.body`。
    6.  延遲 10ms 後添加 `visible` 類，觸發顯示過渡。
    7.  **事件監聽**:
        *   點擊遮罩或「關閉」按鈕時，隱藏模態框並在過渡結束後移除。
        *   如果存在 URL 輸入框，點擊時自動選中所有文字。

### 6.3 `checkForUpdates()`

*   **功能**: 檢查應用程式是否有新版本。
*   **流程**:
    1.  呼叫 `showUpdateModal()` 顯示「檢查更新中...」訊息。
    2.  **API 請求**: 向 GitHub API (`https://api.github.com/repos/renachiouo/vspo_clip_collector/commits?per_page=1`) 發送請求，獲取最新 commit 資訊。
    3.  **錯誤處理**: 如果請求失敗或響應不 OK，拋出錯誤。
    4.  **版本解析**: 從最新 commit 訊息中解析版本號 (例如 `V8.0`)。
    5.  **版本比較**:
        *   如果解析到的最新版本與 `CURRENT_APP_VERSION` 相同，顯示「您目前使用的已是最新版本」訊息。
        *   如果不同，顯示「發現新版本！」訊息，並提供下載按鈕。
    6.  **異常處理**: 捕獲任何錯誤，並呼叫 `showUpdateModal()` 顯示錯誤訊息。

## 7. UI 元件產生器

### 7.1 `createErrorDisplay(error)`

*   **功能**: 創建錯誤訊息顯示元件。
*   **參數**: `error` (String): 錯誤訊息。
*   **流程**:
    1.  創建一個 `div` 元素。
    2.  根據錯誤訊息是否包含「quota」，調整顯示的錯誤訊息和提示。
    3.  設定 `div` 的 Tailwind CSS 類名，使其顯示為紅色背景、紅色邊框、紅色文字的居中提示框。
    4.  返回創建的 `div` 元素。

### 7.2 `createVideoCard(video, showChannel = true)`

*   **功能**: 創建影片卡片元件 (用於網格佈局)。
*   **參數**:
    *   `video` (Object): 影片數據物件，包含 `id`, `title`, `thumbnail`, `channelId`, `channelTitle`, `channelAvatarUrl`, `viewCount`, `publishedAt`。
    *   `showChannel` (Boolean): 是否顯示頻道資訊 (預設 `true`)。
*   **流程**:
    1.  定義 `formatNumber` 函式，將數字格式化為易讀的字串 (例如 10000 -> 1萬)。
    2.  定義 `timeAgo` 函式，將日期字串轉換為「X 時間前」的格式。
    3.  創建一個 `div` 元素作為卡片容器，並設定 Tailwind CSS 類名 (背景色、圓角、陰影、懸停效果等)。
    4.  根據 `showChannel` 參數決定是否生成頻道連結的 HTML。
    5.  將影片縮圖、標題、頻道資訊、觀看次數和發布時間等動態數據注入到卡片的 HTML 結構中。
    6.  圖片載入失敗時，顯示預設錯誤圖片。
    7.  返回創建的 `div` 元素。

### 7.3 `createVideoListItem(video)`

*   **功能**: 創建影片列表項目元件 (用於列表佈局)。
*   **參數**: `video` (Object): 影片數據物件，同 `createVideoCard`。
*   **流程**:
    1.  定義 `formatNumber` 和 `timeAgo` 函式，同 `createVideoCard`。
    2.  創建一個 `div` 元素作為列表項目容器，並設定 Tailwind CSS 類名 (flex 佈局、內邊距、背景色、圓角、懸停效果等)。
    3.  將影片縮圖、標題、頻道資訊、觀看次數和發布時間等動態數據注入到列表項目的 HTML 結構中。
    4.  圖片載入失敗時，顯示預設錯誤圖片。
    5.  返回創建的 `div` 元素。

### 7.4 `createChannelGridCard(channel)`

*   **功能**: 創建頻道網格卡片元件。
*   **參數**: `channel` (Object): 頻道數據物件，包含 `id`, `name`, `subscriberCount`, `latestVideo` (最新影片物件), `avatarUrl`。
*   **流程**:
    1.  定義 `formatNumber` 和 `timeAgo` 函式，同 `createVideoCard`。
    2.  創建一個 `div` 元素作為卡片容器，並設定 Tailwind CSS 類名 (圓角、陰影、懸停效果、相對定位)。
    3.  設定卡片的背景圖片為頻道頭像，並應用半透明遮罩和模糊效果。
    4.  將頻道頭像、名稱、訂閱者數量、最新影片縮圖、標題、觀看次數和發布時間等動態數據注入到卡片的 HTML 結構中。
    5.  包含一個「篩選此頻道」按鈕，用於觸發頻道篩選。
    6.  圖片載入失敗時，顯示預設錯誤圖片。
    7.  返回創建的 `div` 元素。

### 7.5 `isColorLight(hexColor)`

*   **功能**: 判斷給定的十六進制顏色是否為淺色。
*   **參數**: `hexColor` (String): 十六進制顏色碼 (例如 `#RRGGBB` 或 `RRGGBB`)。
*   **流程**:
    1.  解析十六進制顏色碼，提取 R、G、B 分量。
    2.  使用亮度公式 `(R * 0.299 + G * 0.587 + B * 0.114)` 計算亮度值。
    3.  如果亮度值大於 186，則判斷為淺色，返回 `true`；否則返回 `false`。
    *   **用途**: 用於成員篩選按鈕，根據背景色自動調整文字顏色 (深色背景用淺色文字，淺色背景用深色文字)。

### 7.6 `createMemberFilterListHTML(jpMembers, otherGroups, activeFilter)`

*   **功能**: 創建成員篩選按鈕列表的 HTML 結構。
*   **參數**:
    *   `jpMembers` (Array): 日本成員數據。
    *   `otherGroups` (Object): 其他地區成員數據。
    *   `activeFilter` (String): 當前活躍的篩選關鍵字。
*   **流程**:
    1.  創建一個 `div` 元素作為列表容器，並設定 Tailwind CSS 類名 (flex 佈局、滾動條隱藏等)。
    2.  創建「顯示全部」按鈕並添加到容器。
    3.  遍歷 `jpMembers`，為每個成員創建按鈕，並根據 `isColorLight` 函式和 `forceWhiteText` 屬性設定文字顏色。
    4.  遍歷 `otherGroups`，為每個組添加分隔線，然後為組內成員創建按鈕。
    5.  返回創建的 `div` 元素。

### 7.7 `createSkeleton(type)`

*   **功能**: 創建骨架屏元件 (用於載入時的佔位符)。
*   **參數**: `type` (String): 骨架屏類型 (`'card'` 或 `'list'`)。
*   **流程**:
    1.  創建一個 `div` 元素作為骨架屏容器。
    2.  根據 `type` 參數，設定不同的 Tailwind CSS 類名和內部 HTML 結構，模擬影片卡片或列表項目的外觀，並添加 `animate-pulse` 類實現脈衝動畫。
    3.  返回創建的 `div` 元素。

### 7.8 `fetchAllDataFromProxy(force = false, password = '', mode = 'normal')`

*   **功能**: 從代理伺服器獲取所有影片數據。
*   **參數**:
    *   `force` (Boolean): 是否強制刷新快取 (預設 `false`)。
    *   `password` (String): 管理員密碼 (強制刷新時需要)。
    *   `mode` (String): 刷新模式 (`'normal'` 或 `'deep'`)。
*   **流程**:
    1.  構建代理伺服器 API 的 URL。
    2.  如果 `force` 為 `true`，則在 URL 中添加 `force_refresh` 和 `password` 參數，如果 `mode` 為 `'deep'`，則添加 `mode` 參數。
    3.  發送 `fetch` 請求到代理伺服器。
    4.  解析 JSON 響應。
    5.  如果響應狀態不 OK，拋出錯誤 (包含代理伺服器返回的錯誤訊息)。
    6.  返回獲取的數據。

### 7.9 `createPaginationControls(totalPages, currentPage)`

*   **功能**: 創建分頁控制元件。
*   **參數**:
    *   `totalPages` (Number): 總頁數。
    *   `currentPage` (Number): 當前頁碼。
*   **流程**:
    1.  創建一個 `div` 元素作為分頁容器。
    2.  定義 `createBtn` 函式，用於創建單個分頁按鈕 (包含文字、頁碼、禁用狀態、活躍狀態)。
    3.  定義 `createEllipsis` 函式，用於創建省略號。
    4.  添加「上一頁」按鈕。
    5.  根據總頁數，動態生成頁碼按鈕和省略號，確保顯示邏輯合理 (總頁數少於等於 7 時顯示所有頁碼，否則顯示首頁、末頁、當前頁及相鄰頁碼)。
    6.  添加「下一頁」按鈕。
    7.  返回創建的 `div` 元素。

## 8. 渲染邏輯 (`render` 函式)

### 8.1 核心功能

`render(onRenderComplete)` 函式是應用程式的核心渲染邏輯，負責根據 `state` 物件的當前狀態動態更新整個頁面。

*   **參數**: `onRenderComplete` (Function, 可選): 渲染完成後執行的回調函式。
*   **流程**:
    1.  解構 `state` 物件獲取所有相關狀態變數。
    2.  清空 `appContainer` 的內容。
    3.  **黑名單篩選**: `visibleVideos` 陣列通過過濾 `allVideos`，移除黑名單中的頻道影片。
    4.  **渲染 Header**: 創建並添加應用程式標題和版本號。
    5.  **渲染 Top Bar**: 創建並添加頂部資訊欄，包含總人次、今日人次、資料更新時間、回報連結、管理黑名單按鈕和檢查更新按鈕。
    6.  **渲染 Main Grid**: 創建主網格佈局，包含側邊欄篩選區和主要內容區。
    7.  **載入狀態處理**:
        *   如果 `isLoading` 為 `true`，顯示影片骨架屏。
        *   如果 `apiError` 存在，顯示錯誤訊息。
    8.  **影片篩選與顯示**:
        *   **頻道篩選優先**: 如果 `activeChannelFilter` 存在，則只顯示該頻道的影片。
        *   **成員篩選**: 否則，如果 `activeMemberFilter` 不為 `'all'`，則根據成員關鍵字篩選影片 (使用 `video.searchableText` 進行小寫匹配)。
        *   **無篩選**: 如果沒有頻道或成員篩選，則顯示所有 `visibleVideos`。
        *   **無影片提示**: 如果篩選後沒有影片，顯示「找不到影片」的提示訊息。
        *   **篩選橫幅**: 如果有 `activeChannelFilter`，顯示當前篩選的頻道名稱和清除篩選按鈕。
        *   **影片列表/網格顯示**:
            *   如果 `activeView` 為 `'latest'`，顯示最新 10 或 12 部影片 (根據視窗寬度)，使用 `createVideoCard` 創建網格佈局。
            *   如果 `activeView` 為 `'all'`，顯示一個月內的所有影片，並根據 `currentPage` 和 `itemsPerPage` 進行分頁，使用 `createVideoListItem` 創建列表佈局，並顯示分頁控制。
    9.  **頻道列表顯示**:
        *   創建頻道列表區塊，標題根據 `activeMemberFilter` 變化。
        *   從 `videosForChannelList` 中提取所有頻道數據，並過濾出 30 天內有發布新影片的頻道。
        *   按最新影片發布時間排序頻道。
        *   如果存在頻道數據，使用 `createChannelGridCard` 創建網格佈局顯示頻道卡片。
        *   如果沒有符合條件的頻道，顯示相應的提示訊息。
    10. **組裝頁面**: 將所有創建的元素添加到 `appContainer`。
    11. **設定事件監聽器**: 呼叫 `setupEventListeners()` 重新綁定所有事件。
    12. **完成回調**: 如果提供了 `onRenderComplete`，則執行它。

## 9. 事件監聽器 (`setupEventListeners` 函式)

`setupEventListeners()` 函式負責為頁面上的所有互動元素綁定事件監聽器。

*   **流程**:
    1.  呼叫 `setupSecretTrigger()` 綁定秘密觸發器事件。
    2.  為「檢查更新」按鈕綁定 `checkForUpdates` 函式。
    3.  為「管理黑名單」按鈕綁定 `showBlacklistModal` 函式。
    4.  為「最新10/12部」按鈕綁定點擊事件，切換 `activeView` 為 `'latest'` 並重新渲染。
    5.  為「一個月內」按鈕綁定點擊事件，切換 `activeView` 為 `'all'`，重置 `currentPage` 為 1，並重新渲染。
    6.  為所有分頁按鈕 (`.pagination-btn`) 綁定點擊事件，更新 `currentPage` 並重新渲染，同時滾動到頁面頂部。
    7.  為所有成員篩選按鈕 (`.filter-btn`) 綁定點擊事件：
        *   保存當前滾動位置。
        *   清除 `activeChannelFilter`。
        *   更新 `activeMemberFilter` 為點擊按鈕的 `data-filter` 值。
        *   重置 `currentPage` 為 1。
        *   重新渲染，並恢復滾動位置，同時滾動到頁面頂部。
    8.  為所有頻道篩選按鈕 (`.channel-filter-btn`) 綁定點擊事件：
        *   重置 `activeMemberFilter` 為 `'all'`。
        *   更新 `activeChannelFilter` 為點擊按鈕的頻道 ID 和名稱。
        *   重置 `currentPage` 為 1。
        *   重新渲染，並滾動到頁面頂部。
    9.  為「清除頻道篩選」按鈕 (`#clear-channel-filter-btn`) 綁定點擊事件，清除 `activeChannelFilter` 並重新渲染。
    10. 為 `window` 綁定 `resize` 事件，當視窗大小改變且 `activeView` 為 `'latest'` 時，重新渲染以調整顯示影片數量。

## 10. 應用程式初始化 (`initializeApp` 函式)

### 10.1 核心功能

`initializeApp(force = false, password = '', mode = 'normal')` 函式是應用程式的啟動入口，負責初始化狀態、載入數據和渲染頁面。

*   **參數**:
    *   `force` (Boolean): 是否強制刷新代理伺服器快取 (預設 `false`)。
    *   `password` (String): 管理員密碼 (強制刷新時需要)。
    *   `mode` (String): 刷新模式 (`'normal'` 或 `'deep'`)。
*   **流程**:
    1.  從 Local Storage 載入黑名單，更新 `state.blacklist`。
    2.  設定 `state.isLoading` 為 `true`。
    3.  首次呼叫 `render()` 顯示載入骨架屏。
    4.  **數據獲取**: 嘗試呼叫 `fetchAllDataFromProxy()` 從代理伺服器獲取數據。
    5.  **數據處理**:
        *   如果成功獲取數據，將 `dataPackage.videos` 按發布時間降序排序，更新 `state.allVideos`。
        *   更新 `state.lastUpdated`、`state.totalVisits` 和 `state.todayVisits`。
    6.  **錯誤處理**: 捕獲任何錯誤，更新 `state.apiError`，並在強制刷新時彈出錯誤提示。
    7.  **完成渲染**: 無論成功或失敗，最終設定 `state.isLoading` 為 `false`，並再次呼叫 `render()` 顯示最終內容。

## 11. 秘密觸發器 (`setupSecretTrigger` 函式)

### 11.1 核心功能

`setupSecretTrigger()` 函式實現了一個隱藏的管理員功能入口，通過點擊特定文字序列來觸發。

*   **流程**:
    1.  初始化 `sequence` (空陣列，用於儲存點擊的字符序列) 和 `lastClickTime` (上次點擊時間)。
    2.  定義 `targetSequence` 為 `['れ', 'な', 'ち']`。
    3.  遍歷所有帶有 `secret-trigger` 類的 `span` 元素。
    4.  為每個 `span` 元素綁定 `click` 事件監聽器：
        *   獲取點擊的字符 (`data-char`)。
        *   檢查點擊間隔，如果超過 3 秒，重置 `sequence`。
        *   將當前字符添加到 `sequence`。
        *   更新 `lastClickTime`。
        *   **觸發判斷**: 如果 `sequence` 匹配 `targetSequence`：
            *   在控制台輸出「秘密通道已觸發！」
            *   彈出 `prompt` 視窗要求輸入管理員密碼。
            *   如果輸入了密碼：
                *   解析輸入，獲取密碼和模式 (預設 `'normal'`，如果包含 `'deep'` 則為 `'deep'`)。
                *   彈出 `alert` 提示正在執行更新。
                *   呼叫 `initializeApp(true, password, mode)` 強制刷新數據。
            *   重置 `sequence`。
        *   如果 `sequence` 長度達到 `targetSequence` 長度但內容不匹配，重置 `sequence`。

## 12. 背景參數設定與相關依賴支援

*   **代理伺服器**: `PROXY_ENDPOINT` 指向一個 Vercel 部署的代理伺服器，用於繞過 YouTube API 的 CORS 限制和管理 API 金鑰。這意味著前端本身不直接與 YouTube API 互動，而是通過這個中間層。
*   **GitHub API**: 應用程式更新檢查依賴於 GitHub API 來獲取專案的最新 commit 訊息，從中解析版本號。這要求應用程式能夠訪問 GitHub API。
*   **Local Storage**: 黑名單功能完全依賴於瀏覽器的 Local Storage API。這是一個客戶端儲存機制，數據儲存在使用者本地瀏覽器中，不會同步到伺服器。
*   **Tailwind CSS CDN**: 樣式依賴於外部 CDN 載入的 Tailwind CSS 庫。這簡化了開發，但需要網路連接才能正確載入樣式。
*   **VSPO 成員數據**: 成員篩選功能依賴於硬編碼在 JavaScript 中的 `vspoJPMembers` 和 `otherMemberGroups` 陣列。這些數據是靜態的，如果成員列表有變動，需要手動更新程式碼。
*   **影片數據結構**: 應用程式期望從代理伺服器獲取的影片數據包含 `id`, `title`, `thumbnail`, `channelId`, `channelTitle`, `channelAvatarUrl`, `viewCount`, `publishedAt`, `searchableText` 等字段。`searchableText` 字段在後端處理後用於成員篩選。
*   **WebView 判斷**: `isWebView()` 函式用於判斷是否在 Android App 的 WebView 環境中運行，以便在更新提示時提供不同的下載方式 (複製連結而非直接跳轉)。

## 13. 判斷流程總結

1.  **應用程式啟動**: `initializeApp()` 被呼叫。
2.  **初始化狀態**: 載入黑名單，設定載入狀態為 `true`。
3.  **首次渲染**: 呼叫 `render()` 顯示骨架屏。
4.  **數據獲取**: `fetchAllDataFromProxy()` 異步請求影片數據。
5.  **數據處理與更新狀態**: 數據返回後，排序影片，更新 `allVideos`、`lastUpdated`、`totalVisits`、`todayVisits`，並設定 `isLoading` 為 `false`。
6.  **二次渲染**: 再次呼叫 `render()` 顯示實際數據。
7.  **使用者互動**:
    *   **篩選**: 點擊成員篩選按鈕或頻道篩選按鈕，更新 `activeMemberFilter` 或 `activeChannelFilter`，重置 `currentPage`，觸發 `render()`。
    *   **視圖切換**: 點擊「最新10/12部」或「一個月內」按鈕，更新 `activeView`，觸發 `render()`。
    *   **分頁**: 點擊分頁按鈕，更新 `currentPage`，觸發 `render()` 並滾動到頁面頂部。
    *   **黑名單管理**: 點擊「管理黑名單」按鈕，觸發 `showBlacklistModal()`。在模態框中添加/移除頻道會更新黑名單並觸發 `render()` 和 `showBlacklistModal()`。
    *   **檢查更新**: 點擊「檢查更新」按鈕，觸發 `checkForUpdates()`，顯示更新模態框。
    *   **秘密通道**: 點擊特定文字序列，觸發 `setupSecretTrigger()`，要求輸入密碼以執行強制刷新。
8.  **響應式調整**: 視窗大小改變時，如果處於「最新」視圖，會觸發 `render()` 以調整顯示影片數量。

這份規格書詳細描述了 VSPO Clip Collector V8.0 的所有關鍵方面，應能作為未來維護和修改的參考。