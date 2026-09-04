# Trading Journal — Technical Product Specification & Engineering Architecture

**Document Version:** 1.1.0  
**Target Environment:** Client-side Single Page Application (React 18/19 + TypeScript + Vite)  
**Primary UI / Component Layer:** Material UI (MUI v6)  
**Visualization Engine:** Recharts (Interactive Equity curves, P&L bar charts, analytics heatmaps & distributions)  
**State & Data Engine:** TanStack Table v8 + TanStack Query v5 + Dexie.js (IndexedDB)  
**File Generation & Ingestion:** PapaParse (CSV / TSV) + ExcelJS (Formula-rich XLSX export)  
**Internationalization:** i18next + react-i18next + i18next-browser-languagedetector  

---

## 1. Executive Summary & Problem Space

Retail traders frequently track their closed positions using ad-hoc, multi-tab spreadsheets. In the reference case (a sample discretionary trader journal), performance was split across **43 distinct monthly worksheets** inside a single Excel workbook. This legacy pattern introduces critical systemic flaws:

1. **Brittle, Fragile Cell References:** Calculations such as deposit balances and P&L relied on manual cell coordinate formulas (e.g. `=SUM(S17+EC17+DU8)`), breaking whenever rows or columns were shifted.
2. **Matrix-by-Day Anti-Pattern:** Laying out days as rows and trades as sequential horizontal columns ("Trade #1, #2, #3...") prevented natural sorting, multi-column filtering, dynamic virtualization, and broke whenever a high-volume day exceeded the pre-allocated columns.
3. **Absence of Quantitative Risk & Edge Metrics:** Beyond raw dollar gains, key performance indicators—such as Win Rate (adjusted for Breakeven), Profit Factor, Expectancy, Average Win/Loss ratio, Day-of-Week performance, and Peak-to-Trough Drawdown—were absent.
4. **Siloed Time Horizons:** Each month was an isolated silo without a continuous equity curve spanning the lifetime of the trading account.

### Solution Vision
A dedicated, privacy-focused, zero-backend trading terminal web application. The application operates entirely inside the trader's browser (storing data in IndexedDB and preferences in `localStorage`). It parses broker CSV/TSV exports (such as Libertex), deduplicates trades into a unified continuous ledger, computes institutional trading metrics and data-analytics heatmaps/charts, and provides dynamic formula-driven XLSX exports.

---

## 2. Ingest Architecture & Broker CSV Handling

### 2.1 File Characteristics & Quirks
- **Character Encoding:** UTF-8 with optional Byte Order Mark (`\uFEFF`).
- **Line Endings:** Windows CRLF (`\r\n`) or Unix LF (`\n`).
- **Delimiter:** Auto-detected Tab-delimited (`\t`) or Comma-delimited (`,`).
- **Structure Breakdown:**
  - `Line 1`: Platform banner (e.g. `Libertex platform`).
  - `Line 2`: Empty line.
  - `Line 3`: Account metadata block containing Account ID, Account Holder Name, Account Currency (`USD` default), and Report Timestamp.
  - `Line 4`: Empty line.
  - `Line 5`: True column headers (11 core fields in Ukrainian or English).
  - `Lines 6–28`: Data rows representing closed trade deals.
  - `Line 29`: Empty line.
  - `Line 30`: Broker summary / footer row (e.g. `Обсяг:` with margin sum, gross return sum, and net P&L sum).
  - `Line 31+`: Instruction text (e.g. `Вкажіть чітко - скористайтеся опцією Excel "Текст у стовпчику"`).

### 2.2 Canonical Field Mapping

The parser extracts header metadata and maps each trade row to the canonical internal schema via preconfigured, extensible mappings (`csvColumnMap.ts`):

| Libertex UA Source | Canonical Field | Type | Transformation / Normalization |
|---|---|---|---|
| `Інструмент` | `instrument` | `string` | Trimmed symbol name (e.g. `EUR/USD`, `Natural Gas Cash`) |
| `Номер угоди` | `dealId` | `string` | Unique broker deal identifier (e.g. `EURUSD-144189148`) |
| `Напрямок` | `direction` | `'buy' \| 'sell'` | `'Купити'` / `'Buy'` → `'buy'`, `'Продати'` / `'Sell'` → `'sell'` |
| `Дата відкриття` | `openedAt` | `string` (ISO 8601) | Parsed from `d/M/yyyy H:mm` format |
| `Ціна відкриття` | `openPrice` | `number` | Float conversion, localized/dot normalization |
| `Дата закриття` | `closedAt` | `string` (ISO 8601) | Parsed from `d/M/yyyy H:mm` format |
| `Ціна закриття` | `closePrice` | `number` | Float conversion, localized/dot normalization |
| `Сума ($)` | `margin` | `number` | Committed collateral/margin (not full notional) |
| `Коефіцієнт` | `leverage` | `number` | Strips leading `x` (e.g. `'x55'` → `55`) |
| `Результат ($)` | `grossReturn` | `number` | Float conversion (`margin + pnl`) |
| `Прибуток ($)` | `pnl` | `number` | Signed net profit/loss float (positive, negative, or 0) |

### 2.3 Scope of File Ingestion
- **Input:** Only broker CSV / TSV exports are ingested. (Exported `.xlsx` files do not need to be re-imported).
- **Validation:** Net P&L row sum is checked against the broker summary footer row (`Обсяг`) within `±0.01` tolerance.

---

## 3. Data Model & Types

```typescript
export type Direction = 'buy' | 'sell';

export type TradingSession = 'asian' | 'london' | 'new_york' | 'other';

export type GroupByOption = 'none' | 'day' | 'week' | 'month';

export type SortOrder = 'asc' | 'desc';

export type Locale = 'en' | 'ru' | 'uk';

export type NumberFormatOption = 'locale' | 'dot' | 'comma';

export type ThemeMode = 'light' | 'dark' | 'midnight' | 'unicorn' | 'system';

export interface Trade {
  id: string;                       // Unique internal ID (dealId or uuid v4)
  dealId?: string;                  // Original broker deal ID
  instrument: string;               // e.g. "EUR/USD", "Natural Gas Cash"
  direction: Direction;             // "buy" | "sell"
  openedAt: string;                 // ISO 8601 string
  closedAt: string;                 // ISO 8601 string
  openPrice: number;
  closePrice: number;
  margin: number;                   // Collateral / trade size in currency
  leverage: number;                 // Numeric multiplier (e.g. 50)
  grossReturn: number;              // Returned funds (margin + pnl)
  pnl: number;                      // Signed net profit/loss
  tag?: string;                     // Setup / strategy label (e.g. "Breakout", "Pullback")
  session?: TradingSession;         // Auto-derived or manual session
  note?: string;                    // Freeform reflection / execution notes
  plannedRisk?: number;             // Optional planned risk ($) for R-multiple
  isDraft?: boolean;                // Flag for duplicated / unsaved rows
}

export interface JournalSettings {
  initialDeposit: number;           // Starting capital baseline
  depositAsOf: string;              // ISO date when deposit was recorded
  currency: string;                 // Active display currency (default: "USD")
  sortOrder: SortOrder;             // Chronological sort ('asc' oldest first, 'desc' newest first)
  groupBy: GroupByOption;           // Table grouping mode
  numberFormat: NumberFormatOption; // 'locale' (browser default), 'dot' (1,234.56), 'comma' (1.234,56)
}

export interface AppPreferences {
  locale: Locale;                   // Active language
  themeMode: ThemeMode;             // 'light' | 'dark' | 'midnight' | 'unicorn' | 'system'
}

export interface GroupSummary {
  groupKey: string;                 // Formatted date / week / month label
  tradeCount: number;
  netPnl: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;                  // Excludes BE: winCount / (winCount + lossCount) * 100
  breakevenRate: number;            // breakevenCount / tradeCount * 100
  profitFactor: number;
  totalMargin: number;
  grossReturn: number;
}

export interface JournalAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;          // Explicit BE count
  breakevenRate: number;            // BE % of total trades
  netPnl: number;
  currentDeposit: number;
  roiPercent: number;
  winRate: number;                  // Excludes BE from denominator: wins / (wins + losses) * 100
  profitFactor: number;             // Ratio: sum(wins) / abs(sum(losses))
  avgWin: number;
  avgLoss: number;
  expectancy: number;               // Expected dollar return per decisive trade
  maxDrawdownAmount: number;        // Peak-to-trough drop ($)
  maxDrawdownPercent: number;       // Peak-to-trough drop (%)
  currentStreak: {
    type: 'win' | 'loss' | 'breakeven' | 'none';
    count: number;
  };
  bestInstrument: { symbol: string; pnl: number } | null;
  worstInstrument: { symbol: string; pnl: number } | null;
  dayOfWeekPerformance: Array<{ day: string; pnl: number; trades: number; winRate: number }>;
  hourlyDistribution: Array<{ hour: number; pnl: number; trades: number }>;
}
```

---

## 4. Calculated Fields & Pure Formulas

All calculations reside in `src/lib/calculations.ts` as pure, side-effect-free, 100% unit-tested functions.

| Metric | JavaScript Implementation | Excel Dynamic Equivalent |
|---|---|---|
| **Current Deposit** | `initialDeposit + sum(pnl)` | `=InitialDeposit + SUM(Trades[PnL])` |
| **ROI %** | `(sum(pnl) / initialDeposit) * 100` | `=(SUM(Trades[PnL]) / InitialDeposit) * 100` |
| **Breakeven (BE) Count** | `count(pnl === 0)` | `=COUNTIF(Trades[PnL], "=0")` |
| **Breakeven Rate %** | `(count(pnl === 0) / count(all)) * 100` | `=(COUNTIF(Trades[PnL], "=0") / COUNTA(Trades[PnL])) * 100` |
| **Win Rate % (Excluding BE)** | `count(pnl > 0) / (count(pnl > 0) + count(pnl < 0)) * 100` | `=IF((COUNTIF(Trades[PnL],">0")+COUNTIF(Trades[PnL],"<0"))=0, 0, COUNTIF(Trades[PnL],">0")/(COUNTIF(Trades[PnL],">0")+COUNTIF(Trades[PnL],"<0"))*100)` |
| **Profit Factor** | `sum(pnl > 0) / abs(sum(pnl < 0))` (returns `Infinity` if no losses) | `=IF(SUMIF(Trades[PnL],"<0")=0, "N/A", SUMIF(Trades[PnL],">0") / ABS(SUMIF(Trades[PnL],"<0")))` |
| **Avg Win** | `sum(pnl > 0) / count(pnl > 0)` | `=AVERAGEIF(Trades[PnL], ">0")` |
| **Avg Loss** | `abs(sum(pnl < 0) / count(pnl < 0))` | `=ABS(AVERAGEIF(Trades[PnL], "<0"))` |
| **Expectancy ($)** | `(winRateDec * avgWin) - ((1 - winRateDec) * avgLoss)` | `=(WinRate * AvgWin) - ((1 - WinRate) * AvgLoss)` |
| **Max Drawdown ($)** | Peak-to-trough difference on running equity curve | Precomputed running equity column + `=MAX(RunningPeak - RunningEquity)` |
| **Max Drawdown (%)** | Peak-to-trough percentage drop relative to running peak | Precomputed column + `=MAX((RunningPeak - RunningEquity) / RunningPeak) * 100` |
| **Current Streak** | Consecutive winning, losing, or breakeven trades starting from latest closed trade | Computed sequentially on sorted trades |

---

## 5. UI / UX Design System & Themes

The interface provides high-density trading terminal aesthetics with 5 distinct themes, zero MUI button ripple, and high keyboard accessibility.

### 5.1 Five Theme Modes
1. **Dark Midnight:** Pure `#000000` pitch-black OLED background, `#1A1D24` borders, high-contrast `#E6EDF3` typography.
2. **Dark:** Refined charcoal dark surface (`#0D1117` / `#161B22`), soft contrast for long sessions.
3. **Light:** Crisp, clean neutral institutional terminal palette (`#F6F8FA` background, `#FFFFFF` panels, `#1F2328` text).
4. **Unicorn:** Extra vibrant cyberpunk/synthwave iridescent terminal palette: deep purple-indigo surfaces (`#120E24`, `#1D1739`), neon cyan (`#00F5D4`), hot magenta (`#F72585`), neon amber (`#FFE600`), and luminescent gain/loss accents (`#00F5D4` / `#FF0055`).
5. **System:** Automatically tracks browser/OS `prefers-color-scheme` in real time, resolving to **Light** or **Dark**.

### 5.2 Number & Date Formatting with Settings Override
- By default, uses standard browser locale formatting via `Intl.NumberFormat` and `Intl.DateTimeFormat`.
- Settings allow explicit override:
  - Default / Browser Locale
  - Standard Financial Dot (`1,234.56`)
  - European Comma (`1.234,56`)

---

## 6. Advanced Analytics & Visualizations (Recharts)

The analytics dashboard uses **Recharts** for performance and responsive charts:

1. **Cumulative Equity Curve (Line Chart):**
   - Running account deposit over time starting from `InitialDeposit`.
   - Tooltips show date, closed trade P&L, and balance.
2. **Periodic P&L (Bar Chart):**
   - Daily and weekly aggregate P&L bars colored dynamically by outcome (green for profit, red for loss, muted for breakeven).
   - Zero-axis reference line.
3. **Day-of-Week & Session Performance (Heatmap / Bar Distribution):**
   - P&L and Win Rate broken down by Monday through Sunday.
   - Highlights the trader's most and least profitable trading days.
4. **Drawdown Underwater Chart (Area Chart):**
   - Visualizes percentage drop from equity peak over time.
5. **Instrument Performance Breakdown (Horizontal Bar Chart):**
   - Net profit and trade count sorted by instrument (e.g. `EUR/USD`, `Natural Gas Cash`).

---

## 7. Component Architecture & File Layout

```
src/
├── types/
│   ├── trade.ts                   # Trade, Direction, Session, GroupSummary, JournalAnalytics
│   └── preferences.ts             # Locale, ThemeMode, AppPreferences, JournalSettings
├── lib/
│   ├── calculations.ts            # Pure math functions for stats, BE rate, drawdown, equity curve
│   ├── csvColumnMap.ts            # Extensible preconfigured Libertex UA/EN & canonical column maps
│   ├── csvParser.ts               # PapaParse streaming parser with header discovery & validation
│   ├── xlsxTemplate.ts            # ExcelJS generator with dynamic formulas, tables & styles
│   ├── formatters.ts              # Number & date formatters respecting locale & settings override
│   └── db.ts                      # Dexie schema for Trade and Settings tables
├── theme/
│   ├── theme.ts                   # Theme builder, typography, component overrides, disableRipple
│   └── palettes/
│       ├── light.ts               # Neutral institutional light palette
│       ├── dark.ts                # Charcoal dark palette
│       ├── midnight.ts            # Pure black OLED terminal palette
│       └── unicorn.ts             # Vibrant synthwave/cyberpunk unicorn terminal palette
├── i18n/
│   ├── index.ts                   # i18next init with LanguageDetector, fallback to 'en'
│   └── locales/
│       ├── en.json                # English strings
│       ├── ru.json                # Russian strings
│       └── uk.json                # Ukrainian strings
├── hooks/
│   ├── useTradesStore.ts          # Dexie-backed reactive CRUD operations & live trade querying
│   ├── useJournalSettings.ts      # Settings persistence & initial deposit management
│   ├── useAppPreferences.ts       # Theme, language, and number format state in localStorage
│   ├── useCsvImport.ts            # File drag-and-drop & parsing orchestration hook
│   └── useXlsxExport.ts           # Dynamic XLSX generation and file download hook
├── components/
│   ├── upload/
│   │   ├── CsvUploadDropzone.tsx   # Drag-and-drop upload zone with file browsing fallback
│   │   └── ParseErrorSummary.tsx  # Error modal detailing unparsed rows or checksum mismatch
│   ├── analytics/
│   │   ├── StatsCardGrid.tsx      # Responsive grid of trading performance metrics (incl. BE card)
│   │   ├── StatCard.tsx           # Individual metric card with trend icon and tooltip
│   │   ├── EquityCurveChart.tsx   # Recharts interactive equity curve line chart
│   │   ├── DailyPnlChart.tsx      # Recharts daily/weekly positive/negative P&L bar chart
│   │   ├── DayOfWeekChart.tsx     # Recharts day-of-week performance distribution
│   │   ├── DrawdownChart.tsx      # Recharts underwater drawdown area chart
│   │   └── InstrumentChart.tsx    # Recharts horizontal bar chart of instrument P&L
│   ├── table/
│   │   ├── tradeColumns.ts        # TanStack Table column definitions
│   │   ├── TradesTable.tsx        # Virtualized, grouped data table
│   │   ├── TradesTableToolbar.tsx # Deposit input, sort toggle, group-by switch, actions
│   │   ├── TradeRow.tsx           # Table row with conditional negative/positive/breakeven styling
│   │   ├── TradeRowActions.tsx    # Duplicate, edit inline, delete action buttons
│   │   └── GroupHeaderRow.tsx     # Inverted summary header appearing ABOVE child rows
│   ├── deposit/
│   │   └── DepositEditor.tsx      # Editable starting deposit component with currency format
│   └── settings/
│       ├── LanguageSelector.tsx   # Text-only segmented selector ('English', 'Русский', 'Українська')
│       ├── ThemeSwitcher.tsx      # 5-state switcher ('Light', 'Dark', 'Midnight', 'Unicorn', 'System')
│       └── SettingsDialog.tsx     # Modal for currency, number formatting override, data reset
├── pages/
│   └── TradingJournalPage.tsx     # Main application dashboard layout & layout container
├── App.tsx                        # Root provider tree (Theme, i18n, QueryClient, Dexie)
└── main.tsx                       # React application entry point
```

---

## 8. XLSX Export Engine & Formula Specifications

The Excel export is built via **ExcelJS** to generate a native, live-updating spreadsheet:

1. **Named Ranges:**
   - `InitialDeposit`: Defined globally pointing to the dedicated deposit cell (e.g. `Summary!$B$2`).
2. **Excel Table Object (`Trades`):**
   - Structured Excel Table named `Trades`.
   - Columns: `DealID`, `Instrument`, `Direction`, `OpenedAt`, `ClosedAt`, `OpenPrice`, `ClosePrice`, `Margin`, `Leverage`, `GrossReturn`, `PnL`, `Tag`, `Notes`.
3. **Structured Live Formulas:**
   - Account Balance: `=InitialDeposit + SUM(Trades[PnL])`
   - Total Return (ROI %): `=(SUM(Trades[PnL]) / InitialDeposit) * 100`
   - Total Trades: `=COUNTA(Trades[PnL])`
   - Breakeven Trades: `=COUNTIF(Trades[PnL], "=0")`
   - Winning Trades: `=COUNTIF(Trades[PnL], ">0")`
   - Losing Trades: `=COUNTIF(Trades[PnL], "<0")`
   - Win Rate % (Excluding BE): `=IF((COUNTIF(Trades[PnL],">0")+COUNTIF(Trades[PnL],"<0"))=0, 0, COUNTIF(Trades[PnL],">0") / (COUNTIF(Trades[PnL],">0") + COUNTIF(Trades[PnL],"<0")) * 100)`
   - Profit Factor: `=IF(SUMIF(Trades[PnL],"<0")=0, "N/A", SUMIF(Trades[PnL],">0") / ABS(SUMIF(Trades[PnL],"<0")))`
4. **Leftmost Inverted Aggregation:**
   - Daily/Weekly summary tables place summary aggregation columns (Date, Trade Count, Net P&L, Win Rate) at the **left**, matching the UI inverted hierarchy.

---

## 9. Verification & Acceptance Criteria

1. **Parser Fidelity:** Uploading `sample_data/closed_deals_on_02_09_26.csv` results in **exactly 23 trades**, and `sum(pnl)` calculates to **65.09**, matching the broker footer.
2. **Win Rate & Breakeven Metric:**
   - Breakeven trades (`pnl === 0`) are displayed with distinct BE count and percentage.
   - Win Rate formula excludes breakeven trades from the denominator.
3. **Dynamic Deposit & ROI:** Changing the Initial Deposit from 1,000 to 2,000 in the UI instantly recalculates Current Deposit from 1,065.09 to 2,065.09 and updates ROI% from 6.51% to 3.25%.
4. **Loss & Breakeven Row Distinction:**
   - Losing trades (e.g. USD/PLN at `-0.21`) display a red border, tinted row background, and explicit minus sign.
   - Breakeven trades display neutral styling.
5. **Grouped Hierarchy:** With `groupBy: 'day'`, daily aggregate headers appear above child trades showing count, daily P&L, and win rate.
6. **Row Duplication:** Clicking "Duplicate" creates an inline editable draft row. Modifying prices and saving persists the trade to IndexedDB and triggers immediate stats recalculation.
7. **Persistence:** Reloading the browser preserves all trades, draft edits, initial deposit, sort order, theme, and language.
8. **Excel Recalculation:** Opening the exported `.xlsx` file in Excel or LibreOffice and changing a trade P&L automatically updates total balance, ROI%, and win rate via Excel formulas.
9. **5-Theme System:** Instant switching between Light, Dark, Midnight, Unicorn, and System, respecting reduced motion and keeping focus rings visible.
10. **Rich Analytics Visualizations:** Recharts renders responsive Equity Curve, Periodic P&L, Day-of-Week distribution, Drawdown underwater chart, and Instrument breakdown.

---

## 10. Progressive Web App (PWA) & Workbox Specification

The Trading Journal is configured as a fully compliant, installable Progressive Web App (PWA) with zero-backend offline capability.

### 10.1 Service Worker & Workbox Engine
- **Tooling:** `vite-plugin-pwa` utilizing Workbox `generateSW` engine.
- **Lifecycle:** `registerType: 'autoUpdate'`, ensuring seamless background asset updates with instant service worker activation.
- **Cache Limit:** `workbox.maximumFileSizeToCacheInBytes` extended to 5 MiB to accommodate data processing and charting libraries.
- **Precache Manifest:** Automatically precaches all entry points, code-split chunks, HTML, CSS, and static vector/raster icons (`dist/sw.js` and `dist/workbox-*.js`).

### 10.2 Web App Manifest (`manifest.webmanifest`)
- **App Name:** `Trading Journal — Institutional Performance Terminal`
- **Short Name:** `Trading Journal`
- **Description:** `Privacy-first trading journal with real-time analytics, continuous ledger, and live-formula Excel exports`
- **Theme Color:** `#0D1117`
- **Background Color:** `#0D1117`
- **Display Mode:** `standalone` (removes browser URL bar, providing a native trading desk app experience)
- **Orientation:** `any` (responsive across desktop monitors, laptops, tablets, and smartphones)
- **Start URL / Scope:** `/`
- **Categories:** `['finance', 'productivity', 'utilities']`
- **Icon Assets:**
  - `pwa-192x192.png`: Standard Android/PWA home screen icon.
  - `pwa-512x512.png`: High-resolution splash screen and app store listing icon.
  - `maskable-icon-512x512.png`: Adaptive maskable icon supporting rounded, squircle, and circular adaptive device masks.
  - `favicon.svg`: Vector icon for desktop browser tabs.
  - `apple-touch-icon-180x180.png`: iOS home screen bookmark icon with `apple-mobile-web-app-capable` meta tags.

### 10.3 Workbox Runtime Caching
1. **Google Fonts Stylesheets (`fonts.googleapis.com`):**
   - Strategy: `StaleWhileRevalidate`
   - Cache Name: `google-fonts-stylesheets`
2. **Google Fonts Webfonts (`fonts.gstatic.com`):**
   - Strategy: `CacheFirst`
   - Cache Name: `google-fonts-webfonts`
   - Expiration: 1 year (`maxAgeSeconds: 31536000`), maximum 30 entries.

### 10.4 Offline Reliability Guarantee
Because the entire application is architected without backend services (using client-side PapaParse for CSV parsing, pure JavaScript math functions in `calculations.ts`, Dexie.js for IndexedDB storage, and client-side ExcelJS for spreadsheet generation), the application operates with 100% feature parity when offline.

