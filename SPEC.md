# Trading Journal — Technical Product Specification & Engineering Architecture

**Document Version:** 1.2.0  
**Target Environment:** Client-side Single Page Application (React 18/19 + TypeScript + Vite)  
**Primary UI / Component Layer:** Material UI (MUI v6) + @dnd-kit (Accessible block & column drag-and-drop)  
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

| Libertex UA Source | Canonical Field | Type                | Transformation / Normalization                                    |
| ------------------ | --------------- | ------------------- | ----------------------------------------------------------------- |
| `Інструмент`       | `instrument`    | `string`            | Trimmed symbol name (e.g. `EUR/USD`, `Natural Gas Cash`)          |
| `Номер угоди`      | `dealId`        | `string`            | Unique broker deal identifier (e.g. `EURUSD-144189148`)           |
| `Напрямок`         | `direction`     | `'buy' \| 'sell'`   | `'Купити'` / `'Buy'` → `'buy'`, `'Продати'` / `'Sell'` → `'sell'` |
| `Дата відкриття`   | `openedAt`      | `string` (ISO 8601) | Parsed from `d/M/yyyy H:mm` format                                |
| `Ціна відкриття`   | `openPrice`     | `number`            | Float conversion, localized/dot normalization                     |
| `Дата закриття`    | `closedAt`      | `string` (ISO 8601) | Parsed from `d/M/yyyy H:mm` format                                |
| `Ціна закриття`    | `closePrice`    | `number`            | Float conversion, localized/dot normalization                     |
| `Сума ($)`         | `margin`        | `number`            | Committed collateral/margin (not full notional)                   |
| `Коефіцієнт`       | `leverage`      | `number`            | Strips leading `x` (e.g. `'x55'` → `55`)                          |
| `Результат ($)`    | `grossReturn`   | `number`            | Float conversion (`margin + pnl`)                                 |
| `Прибуток ($)`     | `pnl`           | `number`            | Signed net profit/loss float (positive, negative, or 0)           |

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

export type MatrixColumnBlockId = 'date' | 'ordersCount' | 'dailyPnl' | 'orders';

export const DEFAULT_MATRIX_COLUMN_ORDER: MatrixColumnBlockId[] = [
  'date',
  'ordersCount',
  'dailyPnl',
  'orders',
];

export type PageBlockId =
  | 'timeframeBanner'
  | 'statsGrid'
  | 'periodInsights'
  | 'visualizations'
  | 'streakAnalysis'
  | 'instrumentsTable'
  | 'monthlyReturns'
  | 'tradesView'
  | 'forecast';

export const DEFAULT_PAGE_BLOCK_ORDER: PageBlockId[] = [
  'timeframeBanner',
  'statsGrid',
  'periodInsights',
  'visualizations',
  'streakAnalysis',
  'instrumentsTable',
  'monthlyReturns',
  'tradesView',
  'forecast',
];

export type ForecastModelId = 'monteCarlo' | 'linearRegression' | 'runRate' | 'compounding';

export type ForecastScenarioId = 'conservative' | 'average' | 'optimistic';

export interface Trade {
  id: string; // Unique internal ID (dealId or uuid v4)
  dealId?: string; // Original broker deal ID
  instrument: string; // e.g. "EUR/USD", "Natural Gas Cash"
  direction: Direction; // "buy" | "sell"
  openedAt: string; // ISO 8601 string
  closedAt: string; // ISO 8601 string
  openPrice: number;
  closePrice: number;
  margin: number; // Collateral / trade size in currency
  leverage: number; // Numeric multiplier (e.g. 50)
  grossReturn: number; // Returned funds (margin + pnl)
  pnl: number; // Signed net profit/loss
  tag?: string; // Setup / strategy label (e.g. "Breakout", "Pullback")
  session?: TradingSession; // Auto-derived or manual session
  note?: string; // Freeform reflection / execution notes
  plannedRisk?: number; // Optional planned risk ($) for R-multiple
}

export interface JournalSettings {
  initialDeposit: number; // Starting capital baseline
  depositAsOf: string; // ISO date when deposit was recorded
  currency: string; // Active display currency (default: "USD")
  sortOrder: SortOrder; // Chronological sort ('asc' oldest first, 'desc' newest first)
  groupBy: GroupByOption; // Table grouping mode
  numberFormat: NumberFormatOption; // 'locale' (browser default), 'dot' (1,234.56), 'comma' (1.234,56)
  monthlyGoal?: number; // Target monthly profit goal in currency
  matrixColumnOrder?: MatrixColumnBlockId[]; // Custom column sequence for Daily Orders Matrix
  pageBlockOrder?: PageBlockId[]; // Ordered list of main dashboard section IDs
  hiddenPageBlocks?: PageBlockId[]; // Suppressed/hidden dashboard section IDs
}

export interface AppPreferences {
  locale: Locale; // Active language
  themeMode: ThemeMode; // 'light' | 'dark' | 'midnight' | 'unicorn' | 'system'
}

export interface GroupSummary {
  groupKey: string; // Formatted date / week / month label
  tradeCount: number;
  netPnl: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number; // Excludes BE: winCount / (winCount + lossCount) * 100
  breakevenRate: number; // breakevenCount / tradeCount * 100
  profitFactor: number;
  totalMargin: number;
  grossReturn: number;
}

export interface JournalAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number; // Explicit BE count
  breakevenRate: number; // BE % of total trades
  netPnl: number;
  currentDeposit: number;
  roiPercent: number;
  winRate: number; // Excludes BE from denominator: wins / (wins + losses) * 100
  profitFactor: number; // Ratio: sum(wins) / abs(sum(losses))
  avgWin: number;
  avgLoss: number;
  expectancy: number; // Expected dollar return per decisive trade
  maxDrawdownAmount: number; // Peak-to-trough drop ($)
  maxDrawdownPercent: number; // Peak-to-trough drop (%)
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

| Metric                        | JavaScript Implementation                                                          | Excel Dynamic Equivalent                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Current Deposit**           | `initialDeposit + sum(pnl)`                                                        | `=InitialDeposit + SUM(Trades[PnL])`                                                                                                                   |
| **ROI %**                     | `(sum(pnl) / initialDeposit) * 100`                                                | `=(SUM(Trades[PnL]) / InitialDeposit) * 100`                                                                                                           |
| **Breakeven (BE) Count**      | `count(pnl === 0)`                                                                 | `=COUNTIF(Trades[PnL], "=0")`                                                                                                                          |
| **Breakeven Rate %**          | `(count(pnl === 0) / count(all)) * 100`                                            | `=(COUNTIF(Trades[PnL], "=0") / COUNTA(Trades[PnL])) * 100`                                                                                            |
| **Win Rate % (Excluding BE)** | `count(pnl > 0) / (count(pnl > 0) + count(pnl < 0)) * 100`                         | `=IF((COUNTIF(Trades[PnL],">0")+COUNTIF(Trades[PnL],"<0"))=0, 0, COUNTIF(Trades[PnL],">0")/(COUNTIF(Trades[PnL],">0")+COUNTIF(Trades[PnL],"<0"))*100)` |
| **Profit Factor**             | `sum(pnl > 0) / abs(sum(pnl < 0))` (returns `Infinity` if no losses)               | `=IF(SUMIF(Trades[PnL],"<0")=0, "N/A", SUMIF(Trades[PnL],">0") / ABS(SUMIF(Trades[PnL],"<0")))`                                                        |
| **Avg Win**                   | `sum(pnl > 0) / count(pnl > 0)`                                                    | `=AVERAGEIF(Trades[PnL], ">0")`                                                                                                                        |
| **Avg Loss**                  | `abs(sum(pnl < 0) / count(pnl < 0))`                                               | `=ABS(AVERAGEIF(Trades[PnL], "<0"))`                                                                                                                   |
| **Expectancy ($)**            | `(winRateDec * avgWin) - ((1 - winRateDec) * avgLoss)`                             | `=(WinRate * AvgWin) - ((1 - WinRate) * AvgLoss)`                                                                                                      |
| **Max Drawdown ($)**          | Peak-to-trough difference on running equity curve                                  | Precomputed running equity column + `=MAX(RunningPeak - RunningEquity)`                                                                                |
| **Max Drawdown (%)**          | Peak-to-trough percentage drop relative to running peak                            | Precomputed column + `=MAX((RunningPeak - RunningEquity) / RunningPeak) * 100`                                                                         |
| **Current Streak**            | Consecutive winning, losing, or breakeven trades starting from latest closed trade | Computed sequentially on sorted trades                                                                                                                 |

---

## 5. UI / UX Design System & Themes

The interface provides high-density trading terminal aesthetics with 5 distinct themes, zero MUI button ripple, and high keyboard accessibility.

### 5.1 Five Theme Modes

1. **Dark Midnight:** Pure `#000000` pitch-black OLED background, `#1A1D24` borders, high-contrast `#E6EDF3` typography.
2. **Dark:** Refined charcoal dark surface (`#0D1117` / `#161B22`), soft contrast for long sessions.
3. **Light:** Crisp, clean neutral institutional terminal palette (`#F6F8FA` background, `#FFFFFF` panels, `#1F2328` text).
4. **Unicorn:** Extra vibrant high-contrast terminal palette: deep slate-obsidian surfaces (`#0B0F19`, `#111827`), sky accent (`#38BDF8`), and luminescent turquoise accents (`#00F5D4`).
5. **System:** Automatically tracks browser/OS `prefers-color-scheme` in real time, resolving to **Light** or **Dark**.

### 5.2 Number & Date Formatting with Settings Override

- By default, uses standard browser locale formatting via `Intl.NumberFormat` and `Intl.DateTimeFormat`.
- Settings allow explicit override:
  - Default / Browser Locale
  - Standard Financial Dot (`1,234.56`)
  - European Comma (`1.234,56`)

### 5.3 Modular Dashboard Layout & Block Customization (Reordering & Show/Hide)

The dashboard layout is fully customizable, empowering traders to tailor the terminal viewport to their analytical workflow. The page consists of 9 distinct modular blocks that can be independently reordered via accessible drag-and-drop or toggled between visible and hidden states. By default, the predictive **Performance Forecast & Scenarios** block is displayed at the very bottom.

#### 5.3.1 The 9 Modular Dashboard Blocks

| Block ID           | Block Name                             | Semantic Purpose & Contained Components                                                                                                                                                                           |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeframeBanner`  | **Timeframe & Performance Banner**     | Top summary KPI header with active timeframe selector, custom date range picker, deposit quick-editor, and monthly profit goal progress indicator.                                                                |
| `statsGrid`        | **Quantitative Risk Metrics**          | Responsive grid of institutional KPI cards (Net P&L, Win Rate excluding BE, Breakeven Rate, Profit Factor, Expectancy, Average Win/Loss, ROI%, Max Drawdown).                                                     |
| `periodInsights`   | **Performance Insights**               | Automated analytical insights identifying trading edge, risk patterns, execution discipline, and period-over-period observations.                                                                                 |
| `visualizations`   | **Interactive Visualizations**         | Full suite of responsive Recharts analytics: Cumulative Equity Curve, Periodic Net P&L bars, Day-of-Week distribution, Drawdown underwater area chart, and Instrument P&L horizontal bars.                        |
| `streakAnalysis`   | **Streak Analysis**                    | Consecutive win, loss, and breakeven streak counters, current active streak run, and historical streak distributions.                                                                                             |
| `instrumentsTable` | **Instruments Performance Breakdown**  | Tabular summary of symbol-by-symbol performance (P&L, trade count, win rate, average win/loss) with interactive symbol click-to-filter capability.                                                                |
| `monthlyReturns`   | **Monthly Returns Matrix**             | Calendar matrix heatmap tracking percentage and dollar returns aggregated by month and year.                                                                                                                      |
| `tradesView`       | **Trade Ledger & Daily Orders Matrix** | Dual-view container featuring tabbed switching between the continuous TanStack Table ledger (with virtualization and grouping) and the Daily Orders Matrix Table.                                                 |
| `forecast`         | **Performance Forecast & Scenarios**   | Multi-scenario future projection suite (Monte Carlo bootstrap, OLS regression, run-rate, compounding) across Conservative, Average, and Optimistic modes, with fan chart, technique descriptions, and disclaimer. |

#### 5.3.2 Drag-and-Drop Reordering Engine

- **Accessible DND Infrastructure:** Built with `@dnd-kit/core` and `@dnd-kit/sortable` employing `verticalListSortingStrategy` and `arrayMove`.
- **Multi-Input Modality:**
  - **Pointer Drag:** Activated via dedicated drag handles (`DragIndicatorIcon`) with a 4px movement activation constraint (`PointerSensor`) to eliminate accidental drag events during standard click interactions.
  - **Keyboard Accessible:** Full keyboard reordering support via `KeyboardSensor` mapped to `sortableKeyboardCoordinates` (Space to pick up, Up/Down arrow keys to reorder, Space to drop, Escape to cancel), satisfying WCAG 2.1 AA accessibility guidelines.
- **Visual Drag Feedback:** Utilizes a fluid `DragOverlay` displaying an elevated block preview card with 1.02x scale, deepened shadows, primary border accent, and a calibrated cubic-bezier drop animation (`cubic-bezier(0.18, 0.67, 0.6, 1.22)`).

#### 5.3.3 Show/Hide (Visibility) Controls & State Management

- **Individual Toggle Controls:** Each block in the settings drawer features an independent visibility switch / action, allowing traders to conceal non-essential blocks and focus solely on pertinent metrics.
- **Live Inventory Counter:** A persistent chip badge displays current visibility status (e.g. `9/9 Blocks Active`), transitioning to an error/warning color when all blocks are hidden.
- **One-Click Restores:**
  - **Show All:** Immediately unhides all suppressed blocks without altering custom block ordering.
  - **Reset to Default:** Reverts both block ordering and visibility to canonical defaults (`DEFAULT_PAGE_BLOCK_ORDER` with zero hidden blocks).
- **Fail-Safe All-Hidden Empty State:** If a trader suppresses all 9 blocks, the dashboard gracefully renders a centralized fallback state (`allHiddenTitle` / `allHiddenSubtitle`) with a prominent "Restore All Blocks" button to guarantee that the user is never locked out of the interface.

#### 5.3.4 Layout Settings Drawer (`PageLayoutSettingsDrawer`)

- **Slide-Over Panel:** Right-anchored drawer invoked via the header tune icon (`TuneIcon`) or the trade view toolbar settings button.
- **Two-Tab Structure:**
  1. **Page Blocks Tab (`layout`):** Houses the draggable, sortable block cards with visibility switches, live counters, and reset actions.
  2. **General Preferences Tab (`preferences`):** Houses global currency selection, number formatting override (locale, dot, comma), and data management (danger zone ledger wipe).

#### 5.3.5 Persistence & Self-Healing Reconciliation

- **IndexedDB Persistence:** Layout arrangements are committed reactively to IndexedDB (`db.settings` key `journalSettings`) with fields `pageBlockOrder: PageBlockId[]` and `hiddenPageBlocks: PageBlockId[]`.
- **Self-Healing Reconciliation:** Upon loading, `useJournalSettings` validates stored block IDs against `DEFAULT_PAGE_BLOCK_ORDER`. Obsolete IDs from deprecated versions are pruned, while newly introduced platform blocks are seamlessly appended to the end of the user's custom sequence, preventing layout corruption across application upgrades.

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

### 6.1 Quantitative Performance Forecasting & Probabilistic Scenarios

The terminal features a dedicated predictive analytics engine (`src/lib/forecastEngine.ts`) calculating forward equity trajectories across three core scenarios: **Conservative** (10th percentile), **Average / Expected** (50th percentile / median), and **Optimistic** (90th percentile).

1. **Four Analytical & Statistical Methodologies:**
   - **Monte Carlo Bootstrap Resampling:** Generates 2,000 empirical random-walk trajectories sampled with replacement from historical trade P&Ls, yielding empirical distribution cones, probability of net profit, and estimated maximum drawdown risk.
   - **Ordinary Least Squares (OLS) Linear Regression:** Fits cumulative equity trendlines ($\hat{y} = \alpha + \beta t$) with expanding confidence intervals ($z = 1.28$ for 10th/90th percentile bounds).
   - **Rolling Moving Average Run-Rate:** Computes smoothed rolling mean return and standard deviation over recent trades, projecting volatility-adjusted cumulative performance cones.
   - **Compounding Geometric Return Rate:** Formulates log-normal rate of return compounded forward geometrically, modeling capital reinvestment variance.
2. **Dual Horizon Modes (Time Horizon vs. Trade Count):**
   - **Time Horizon (Default Mode):** Forward projection over `1m`, `3m`, `6m`, and `12m`. Dynamically derives and renders the approximate trade volume (`~N trades`) based on empirical historical trading velocity (`estimateMonthlyTradesRate`).
   - **Trade Count Mode:** Discrete forward projection over `+30`, `+60`, `+90`, and `+180` trades.
3. **Background Web Worker Offloading & 1-Hour Caching:**
   - **Lazy On-Demand Computation:** Calculations are strictly lazy and do NOT run on initial page load, preventing unnecessary background resource usage. The block displays an inviting placeholder prompt until the user explicitly selects a forecast horizon.
   - **Web Worker Multithreading:** Once an option is selected, heavy Monte Carlo simulations (2,000 empirical random walks) and statistical regressions are offloaded to a dedicated Web Worker (`src/workers/forecast.worker.ts`), preventing main-thread lag and guaranteeing 60fps terminal responsiveness.
   - **1-Hour In-Memory Caching (`src/lib/forecastCache.ts`):** Forecast results are cached for **1 hour** (`3,600,000 ms`) keyed by snapshot parameters (trade count, IDs, timestamps, initial deposit, model, horizon, and rate). Switching back to previously computed horizons within 1 hour resolves synchronously with zero delay.
   - **Immediate Loading Feedback:** Clicking any horizon button triggers immediate visual feedback: an indeterminate linear progress bar runs along the container top, the clicked horizon button displays a subtle spinner, and the active visualization cone transitions smoothly with `aria-busy="true"`.
4. **Interactive Fan Chart:**
   - Recharts ComposedChart rendering historical equity leading up to the current balance, branching into a shaded confidence cone area (gradient fill between conservative and optimistic bounds) with the baseline trajectory highlighted.
5. **Strictly Concise Technique Descriptions:**
   - Each methodology includes an explanatory summary strictly constrained to **15 words or fewer** in all supported locales.
6. **Regulatory Financial Risk Disclaimer:**
   - Prominent standard cautionary disclaimer emphasizing that past performance is not indicative of future returns and that models are theoretical.

---

## 7. Component Architecture & File Layout

```
src/
├── types/
│   ├── trade.ts                   # Trade, Direction, Session, GroupSummary, JournalAnalytics
│   ├── preferences.ts             # Locale, ThemeMode, AppPreferences, JournalSettings
│   └── forecast.ts                # ForecastModelId, ForecastScenarioId, ForecastResult, Worker Request/Response
├── workers/
│   └── forecast.worker.ts         # Dedicated Web Worker offloading Monte Carlo & scenario modeling
├── lib/
│   ├── calculations.ts            # Pure math functions for stats, BE rate, drawdown, equity curve
│   ├── forecastEngine.ts          # Monte Carlo, OLS regression, run-rate & compounding forecast algorithms
│   ├── forecastCache.ts           # 1-minute TTL in-memory forecast cache and key generation
│   ├── forecastWorkerClient.ts    # Web Worker manager, async dispatcher, and graceful main-thread fallback
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
│       └── uk.json                # Ukrainian strings
├── hooks/
│   ├── useTradesStore.ts          # Dexie-backed reactive CRUD operations & live trade querying
│   ├── useJournalSettings.ts      # Settings persistence & initial deposit management
│   ├── useAppPreferences.ts       # Theme, language, and number format state in localStorage
│   ├── useCsvImport.ts            # File drag-and-drop & parsing orchestration hook
│   └── useXlsxExport.ts           # Dynamic XLSX generation and file download hook
├── components/
│   ├── upload/
│   │   ├── CsvUploadDropzone.tsx      # Drag-and-drop upload zone with full-page drop overlay
│   │   ├── ParseErrorSummary.tsx     # Diagnostics modal detailing parse errors / checksum mismatch
│   │   ├── ImportStrategyDialog.tsx  # Import reconciliation modal (Merge deduplicated vs Replace)
│   │   └── ImportSummaryDialog.tsx   # Post-ingestion summary modal reporting imported trades count
│   ├── analytics/
│   │   ├── TimeframeHeaderBanner.tsx # Top performance summary banner with timeframe filters & quick edit
│   │   ├── StatsCardGrid.tsx         # Responsive grid of trading performance metrics (incl. BE card)
│   │   ├── StatCard.tsx              # Individual metric card with trend icon and tooltip
│   │   ├── PeriodInsightsCard.tsx    # High-level analytical insights and observations card
│   │   ├── VisualizationsSection.tsx # Container for Recharts responsive charts
│   │   ├── EquityCurveChart.tsx      # Interactive cumulative equity curve line chart
│   │   ├── DailyPnlChart.tsx         # Daily/weekly positive/negative P&L bar chart
│   │   ├── DayOfWeekChart.tsx        # Day-of-week performance distribution
│   │   ├── DrawdownChart.tsx         # Underwater drawdown area chart
│   │   ├── InstrumentChart.tsx       # Horizontal bar chart of instrument P&L
│   │   ├── StreakAnalysisSection.tsx # Consecutive win, loss, and breakeven streak analyzer
│   │   ├── InstrumentsTable.tsx      # Symbol-by-symbol performance breakdown table with click-to-filter
│   │   └── MonthlyReturnsHeatmap.tsx # Multi-year monthly returns percentage/dollar calendar matrix
│   ├── table/
│   │   ├── TradesViewSection.tsx     # Tabbed container hosting Trade Ledger and Daily Orders Matrix
│   │   ├── tradeColumns.ts           # TanStack Table column definitions
│   │   ├── TradesTable.tsx           # Virtualized, grouped continuous trade ledger table
│   │   ├── TradesTableToolbar.tsx    # Search input, sort toggle, group-by switch, export/settings actions
│   │   ├── TradeRow.tsx              # Table row with conditional negative/positive/breakeven styling
│   │   ├── TradeRowActions.tsx       # Duplicate, inline edit, delete action buttons
│   │   └── GroupHeaderRow.tsx        # Inverted summary header appearing ABOVE child rows
│   ├── matrix/
│   │   ├── DailyOrdersMatrixTable.tsx # Daily calendar order matrix with reorderable column blocks
│   │   ├── SortableColumnHeader.tsx   # Reorderable column header with dnd-kit pointer drag handle
│   │   └── ColumnDragPreview.tsx      # DragOverlay floating column block preview
│   ├── forecast/
│   │   ├── ForecastSection.tsx       # Predictive scenario container with model & horizon selectors
│   │   ├── ForecastChart.tsx         # Recharts confidence cone fan chart with scenario bounds
│   │   └── ForecastKpiCards.tsx      # Three-mode scenario cards (Conservative, Average, Optimistic)
│   ├── settings/
│   │   ├── PageLayoutSettingsDrawer.tsx # Slide-over drawer for block reorder, visibility & preferences
│   │   ├── SortableBlockItem.tsx     # Sortable item wrapper with keyboard & pointer sensors
│   │   ├── BlockCard.tsx             # Block preview card with visibility toggle switch & drag handle
│   │   ├── blockConfigs.tsx          # Canonical registry and metadata for all 9 modular blocks
│   │   ├── LanguageSelector.tsx      # Text-only segmented selector ('English', 'Українська')
│   │   └── ThemeSwitcher.tsx         # 5-state switcher ('Light', 'Dark', 'Midnight', 'Unicorn', 'System')
│   ├── deposit/
│   │   └── DepositEditor.tsx         # Starting deposit editor with currency formatting
│   └── layout/
│       ├── JournalHeader.tsx         # Top app bar with brand, file actions, theme & layout drawer toggle
│       └── Footer.tsx                # Terminal footer with version and offline status indicator
├── pages/
│   └── TradingJournalPage.tsx        # Main application dashboard coordinating dynamic block layout
├── App.tsx                           # Root provider tree (Theme, i18n, QueryClient, Dexie)
└── main.tsx                          # React application entry point
```

---

## 8. XLSX Export Engine & Formula Specifications

The Excel export is built via **ExcelJS** to generate a native, multi-sheet, live-updating spreadsheet:

1. **Multi-Sheet Architecture:**
   - **`Daily Journal`**: The primary operational dashboard featuring the Daily Order Matrix, Account KPIs, Monthly Summary, and Weekly Breakdown.
   - **`Trades`**: Full 13-column detailed ledger of all broker trades formatted as an Excel Table (`DealID`, `Instrument`, `Direction`, `OpenedAt`, `ClosedAt`, `OpenPrice`, `ClosePrice`, `Margin`, `Leverage`, `GrossReturn`, `PnL`, `Tag`, `Notes`).
   - **`Analytics`**: Institutional performance table summarizing Win Rate, Profit Factor, Mathematical Expectancy, and Max Drawdown.

2. **Daily Journal — Layout & Structured Live Formulas:**
   - **Account Statistics Card (`A1:C5`):**
     - Initial Deposit (`B2`): Named range `InitialDeposit`.
     - Current Deposit (`B3`): Live formula `=InitialDeposit + B5`.
     - Profit % (`B4`): Live formula `=(B5/InitialDeposit)*100`.
     - Total Profit (`B5`): Live formula `=F2` (referencing Monthly Net P&L).
   - **Monthly Summary (`E1:G5`):**
     - Net P&L (`F2`): Live formula summing daily P&L values (`=SUM(...)`).
     - Closed Orders (`F3`): Live formula summing daily closed order counts (`=SUM(...)`).
     - Explanations (`E4:G5`): Clear bilingual explanatory guidance in Ukrainian and English (_"Сумарний чистий прибуток/збиток та загальна кількість закритих угод за місяць"_ / _"Total net profit/loss and total closed orders for the month"_).
   - **Weekly Breakdown (`I1:L...`):**
     - Chronological breakdown for each calendar week (Week number, Date range, Weekly Orders `=SUM(...)`, Weekly P&L `=SUM(...)`).
     - Bilingual explanation notes describing the weekly aggregation logic.
   - **Daily Order Matrix (`Row 10+`):**
     - Header: `Дата (Date)`, `Закритих угод (Closed Orders)`, dynamic trade columns (`1`, `2`, `3` ... `N`), and `Денний P&L (Daily P&L)`.
     - For each trading day:
       - Closed Orders: Live Excel formula `=COUNT(C{row}:{lastTradeCol}{row})`.
       - Trade columns: Individual order P&Ls ordered chronologically by close time, styled in soft green for wins and soft red for losses.
       - Daily P&L: Live Excel formula `=SUM(C{row}:{lastTradeCol}{row})`.
     - **Totals Row:** Live `=SUM(...)` formulas for both total closed orders and cumulative P&L across all trade columns.

3. **Recalculation:**
   - Modifying any trade P&L in either the Daily Journal matrix or the Trades sheet triggers automatic recalculation of daily totals, weekly totals, monthly net P&L, account balance, and ROI% in Microsoft Excel, LibreOffice, and Google Sheets.

4. **Matrix Column Reordering & Dynamic Formula Alignment:**
   - The Daily Orders Matrix Table supports drag-and-drop column reordering across its 4 core blocks: `'date'`, `'ordersCount'`, `'dailyPnl'`, and `'orders'`.
   - **Dynamic XLSX Engine Recalculation:** The Excel export engine (`xlsxTemplate.ts`) reads `settings.matrixColumnOrder`. It dynamically maps column coordinates (`dateColIndex`, `ordersColIndex`, `dailyPnlColIndex`, `firstTradeColIndex`, `lastTradeColIndex`) and computes the matching Excel column letters (`ordersColLetter`, `dailyPnlColLetter`, `firstTradeColLetter`, `lastTradeColLetter`).
   - Formula references for closed orders (`=COUNT({firstTrade}{row}:{lastTrade}{row})`) and daily net P&L (`=SUM({firstTrade}{row}:{lastTrade}{row})`) dynamically reference the reordered trade column range.
   - Totals row formulas (`=SUM(...)`) dynamically track the reordered column coordinates, preserving formula recalculation and mathematical fidelity across Microsoft Excel, Apple Numbers, LibreOffice Calc, and Google Sheets.

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
6. **Inline Trade Editing:** Clicking "Edit" enables inline editing of trade parameters with automatic PnL recalculation upon price or margin changes, persisted directly to IndexedDB.
7. **Dashboard Page Block Reordering & Accessibility:**
   - Dragging and dropping blocks in the `PageLayoutSettingsDrawer` via pointer or keyboard navigation (`KeyboardSensor`) updates the dashboard rendering sequence.
   - Reordered blocks persist in IndexedDB (`db.settings.journalSettings.pageBlockOrder`) and survive full browser reloads.
8. **Dashboard Block Show/Hide & Fail-Safe Recovery:**
   - Toggling visibility switches in the settings drawer hides or reveals corresponding dashboard sections.
   - Live counter badge tracks visible vs. total blocks (`visible / total`).
   - Hiding all 9 blocks triggers the fail-safe empty state with a "Restore All Blocks" button that resets visibility.
   - "Reset to Default" restores default canonical order (`DEFAULT_PAGE_BLOCK_ORDER`) and unhides all blocks.
9. **Daily Orders Matrix Column Reordering:**
   - Dragging column headers in the Daily Orders Matrix rearranges the 4 core blocks (`date`, `ordersCount`, `dailyPnl`, `orders`).
   - The custom column sequence is persisted to IndexedDB (`matrixColumnOrder`).
   - "Reset Order" toolbar action restores the default column order (`DEFAULT_MATRIX_COLUMN_ORDER`).
10. **Synchronized Dynamic XLSX Export:**
    - Exporting an XLSX with a custom matrix column order matches the user-configured column sequence in the exported "Daily Journal" sheet.
    - Dynamic Excel formulas (`=COUNT(...)`, `=SUM(...)`) automatically adjust their cell ranges to the reordered trade columns.
11. **Three-Mode Performance Forecast Block:**
    - The Forecast Block renders by default at the very bottom of the dashboard.
    - Accurately generates Conservative (10th percentile), Average (50th percentile), and Optimistic (90th percentile) projections across Monte Carlo (2,000 resampled iterations), OLS Linear Regression, Moving Average Run-Rate, and Compounding Return models.
    - Interactive Recharts fan chart renders historical balance and projected scenario confidence cone.
    - Technique descriptions under charts are strictly 15 words or fewer in all supported languages.
    - Clear regulatory financial disclaimer warns that past performance does not guarantee future results.
12. **Persistence:** Reloading the browser preserves all trades, initial deposit, sort order, theme, language, page block order (including forecast), hidden page blocks, and matrix column order.
13. **Excel Recalculation:** Opening the exported `.xlsx` file in Excel or LibreOffice and changing a trade P&L automatically updates total balance, ROI%, and win rate via Excel formulas.
14. **5-Theme System:** Instant switching between Light, Dark, Midnight, Unicorn, and System, respecting reduced motion and keeping focus rings visible.
15. **Rich Analytics Visualizations:** Recharts renders responsive Equity Curve, Periodic P&L, Day-of-Week distribution, Drawdown underwater chart, Instrument breakdown, and Forecast confidence cone.

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
