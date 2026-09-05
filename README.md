# Liber Journal — Trading Journal Web Terminal

[![Live Demo](https://img.shields.io/badge/Live%20Demo-liber--journal.vercel.app-brightgreen?style=flat-square)](https://liber-journal.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-ydegtyar%2Fliber--journal-blue?style=flat-square&logo=github)](https://github.com/ydegtyar/liber-journal)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Vitest-37%20passed-success?style=flat-square&logo=vitest)](https://vitest.dev/)

A high-performance, privacy-first, zero-backend trading journal web terminal built with **React**, **TypeScript**, **TanStack Table**, **MUI v6**, **Recharts**, **PapaParse**, **ExcelJS**, and **Dexie.js (IndexedDB)**.

Designed to replace fragile, multi-tab spreadsheets with a continuous ledger, real-time institutional performance analytics, and live-formula Microsoft Excel exports.

---

## 🚀 Live Demo

**Production URL**: [https://liber-journal.vercel.app](https://liber-journal.vercel.app)

---

## 📌 Core Features

- **Broker CSV/TSV Ingest**: Robust parser built for Libertex (Ukrainian and English exports) and standard tabular exports.
  - Strips UTF-8 BOM, skips pre-header platform banners, auto-detects tab vs. comma delimiters.
  - Extracts preamble account metadata (`Account ID`, `Account Holder`, `Currency`, `Report Date`).
  - Automatically identifies header row using canonical column aliases.
  - Validates row P&L sum against broker footer totals (`Обсяг:`) with checksum tolerance verification.
- **Institutional Edge & Risk Metrics**:
  - **Win Rate (Excl. BE)**: Breakeven trades (`pnl === 0`) are excluded from the denominator (`wins / (wins + losses) * 100`).
  - **Dedicated Breakeven Metric**: Surfaces exact BE trade count and rate percentage.
  - **Account Balance & ROI%**: Real-time balance computed against starting deposit.
  - **Profit Factor**: Gross Win divided by Gross Loss (returns $\infty$ when 0 losses).
  - **Average Win / Average Loss & Mathematical Expectancy**.
  - **Peak-to-Trough Drawdown**: Tracks maximum dollar and percentage drawdowns.
  - **Streak Tracker**: Tracks winning, losing, or breakeven consecutive streaks.
  - **Best & Worst Assets**: Automatic ranking by net P&L.
- **Advanced Visualizations (Recharts)**:
  - **Cumulative Equity Curve**: Account growth over time.
  - **Periodic P&L**: Bar chart with color-coded profit, loss, and breakeven bars.
  - **Day-of-Week Distribution**: Identifies edge across Monday through Sunday.
  - **Drawdown Underwater Curve**: Area chart visualizing percentage drop from peak equity.
  - **Instrument Comparison**: Horizontal bar chart comparing asset performance.
- **Interactive High-Density Table**:
  - **Inverted Aggregation**: Daily, weekly, or monthly summary headers sit **above** child trades showing subtotal margin, win rate, and net P&L.
  - **Sortable Chronology**: Fast toggle between `Oldest First` and `Newest First`.
  - **Accessible Loss Highlighting**: Tinted row background, colored metric value, and directional trend icon.
  - **Inline Editing**: Edit trade values with live real-time PnL recalculation.
- **Daily Orders Matrix (Export Format UI & Row Copy)**:
  - Direct UI representation of the exported `Daily Journal` matrix: date, closed order count, sequential trade P&L columns (`1`, `2`, `3`, ..., `N`), and daily net P&L.
  - **1-Click Row Copy**: Each row features a copy button to copy the day's record in tab-separated values (TSV) format, ready for direct copy-pasting into existing Excel or Google Sheets workbooks.
  - **Flexible Copy Modes**: Copy full row (date, count, trades, total) or trades-only (for pasting from column C onwards).
  - Respects active number formatting (comma `,` vs dot `.`) to match European and standard Excel locales without decimal parse errors.
- **Dynamic Excel (XLSX) Export**:
  - Powered by **ExcelJS** to write **real Excel formulas**, named range `InitialDeposit`, and multi-sheet workbooks.
  - **`Daily Journal` Sheet**: Features a Daily Order Matrix with trade count per day (`=COUNT(...)`), individual order P&L columns (`1`, `2`, `3`, ...), daily P&L totals (`=SUM(...)`), Monthly & Weekly P&L cards with bilingual Ukrainian/English explanatory notes, and live account ROI%.
  - **`Trades` Sheet**: Full 13-column ledger of all raw trades with structured Excel Table formatting (`TradesTable`).
  - **`Analytics` Sheet**: Institutional metrics summary (Win Rate, Profit Factor, Expectancy, Max Drawdown).
  - Editing any trade cell in Excel dynamically updates daily totals, monthly net P&L, balance, and ROI% automatically.
- **5 Terminal Themes**:
  - **Light**: Crisp institutional terminal palette.
  - **Dark**: Refined charcoal.
  - **Dark Midnight**: Pitch-black `#000000` OLED terminal.
  - **Unicorn**: Vibrant high-contrast terminal palette (deep slate-obsidian surfaces with neon cyan and sky accents).
  - **System**: Live listener tracking OS `prefers-color-scheme`.
  - Global `disableRipple` and visible keyboard focus rings.
- **Internationalization (i18n)**:
  - Full translations for **English** and **Українська** with native endonyms (no country flags).
  - Number format override: Browser Locale, Standard Financial Dot (`1,234.56`), or European Comma (`1.234,56`).
- **Progressive Web App (PWA) with Workbox**:
  - Offline-first caching with service worker (`vite-plugin-pwa` and Workbox `generateSW`).
  - Web App Manifest supporting standalone desktop/mobile installation.
  - Multi-resolution icon set (192x192, 512x512, 512x512 maskable, SVG, iOS Apple Touch Icon).
  - Background auto-updates with Google Fonts caching strategies.
- **100% Client-Side Privacy**:
  - All trades persist in the browser via IndexedDB (`Dexie.js`).
  - No remote databases, no tracking, zero backend required.

---

## 🛠️ Development & Deployment Instructions

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone git@github.com:ydegtyar/liber-journal.git
cd liber-journal

# Install dependencies
npm install
```

### Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Automated Tests
```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Build for Production
```bash
npm run build
```
Production assets are generated in the `dist/` directory.

### Automatic Deployment on Push

#### Option A: Native Vercel Git Integration (Recommended)
1. Go to your project's [Vercel Git Settings](https://vercel.com/yuriy-degtyars-projects-0321a19b/liber-journal/settings/git).
2. Click **Connect Git Repository** and select `ydegtyar/liber-journal`.
3. Every `git push` to `main` will automatically build and deploy the production site with live URL previews on PRs.

#### Option B: GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
1. On every push and pull request to `main`, GitHub Actions automatically runs:
   - Vitest test suite (`npm test`)
   - Production type-checking and PWA build (`npm run build`)
2. To enable automated deployment via GitHub Actions:
   - Add a `VERCEL_TOKEN` secret to your GitHub repository ([GitHub Repo Secrets Settings](https://github.com/ydegtyar/liber-journal/settings/secrets/actions)).
   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are already pre-configured as repository variables.

#### Manual CLI Deployment
```bash
npm run deploy
```

---

## 📊 Sample Data Testing

A verified Libertex test fixture is provided in [`sample_data/closed_deals_on_02_09_26.csv`](sample_data/closed_deals_on_02_09_26.csv). Drag and drop this file onto the web terminal to immediately verify:
- Exactly 23 trades parsed.
- Account `9990001122` (`DEMO TRADER`, `USD`).
- Net P&L checksum matches `$65.09`.
- Losing trade (`USD/PLN` at `-$0.21`) highlighted.

---

## 📄 License

MIT © [Yuriy Degtyar](https://github.com/ydegtyar)
