import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import { Logo } from '../components/common/Logo';
import './InfoPage.css';

interface ThemeOption {
  id: string;
  name: string;
  image: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'dark', name: 'Dark Terminal', image: '/assets/info/terminal-dark.png' },
  { id: 'unicorn', name: 'Unicorn Synthwave', image: '/assets/info/terminal-unicorn.png' },
  { id: 'midnight', name: 'Midnight OLED', image: '/assets/info/terminal-midnight.png' },
  { id: 'light', name: 'Institutional Light', image: '/assets/info/terminal-light.png' },
  { id: 'charts', name: 'Interactive Recharts', image: '/assets/info/visualizations-showcase.png' },
];

const InfoPage: React.FC = () => {
  const [activeThemeTab, setActiveThemeTab] = useState('dark');
  const [, startTransition] = useTransition();

  // Interactive Live Trading Calculator & Edge Simulator
  const [simCapital, setSimCapital] = useState(10000);
  const [simWinRate, setSimWinRate] = useState(65);
  const [simRiskReward, setSimRiskReward] = useState(2.2);
  const [simTradesPerMonth, setSimTradesPerMonth] = useState(30);

  // Computed Edge Metrics based on spec formulas
  const simMetrics = useMemo(() => {
    const winRateDec = simWinRate / 100;
    const lossRateDec = 1 - winRateDec;
    const avgRisk = simCapital * 0.015; // 1.5% risk per trade
    const avgWin = avgRisk * simRiskReward;
    const avgLoss = avgRisk;

    // Mathematical Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
    const expectancy = winRateDec * avgWin - lossRateDec * avgLoss;

    // Profit Factor = (WinRate * AvgWin) / (LossRate * AvgLoss)
    const profitFactor = lossRateDec > 0 ? (winRateDec * avgWin) / (lossRateDec * avgLoss) : 999;

    // Projected Monthly Return
    const monthlyNetPnl = expectancy * simTradesPerMonth;
    const monthlyRoi = (monthlyNetPnl / simCapital) * 100;
    const finalDeposit = simCapital + monthlyNetPnl;

    // Generate mini SVG path coordinates
    const points: [number, number][] = [];
    let current = simCapital;
    points.push([0, current]);
    for (let i = 1; i <= 12; i++) {
      const stepNoise = Math.sin(i * 1.5) * (avgRisk * 0.7);
      current += expectancy * (simTradesPerMonth / 12) + stepNoise;
      points.push([i, Math.max(simCapital * 0.7, current)]);
    }

    const minVal = Math.min(...points.map((p) => p[1]));
    const maxVal = Math.max(...points.map((p) => p[1]));
    const range = maxVal - minVal || 1;

    const svgPath = points
      .map((p, idx) => {
        const x = (p[0] / 12) * 280;
        const y = 80 - ((p[1] - minVal) / range) * 60;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return {
      expectancy,
      profitFactor,
      monthlyNetPnl,
      monthlyRoi,
      finalDeposit,
      avgWin,
      avgLoss,
      svgPath,
    };
  }, [simCapital, simWinRate, simRiskReward, simTradesPerMonth]);

  // Set document title & metadata on mount
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Liber Journal — Institutional Trading Performance Terminal & Architecture';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  const activeImage =
    THEME_OPTIONS.find((t) => t.id === activeThemeTab)?.image || '/assets/info/terminal-dark.png';

  return (
    <div className="info-page-root">
      {/* React 19 Hoisted Document Head SEO & GEO Tags */}
      <title>Liber Journal — Institutional Trading Performance Terminal &amp; Architecture</title>
      <meta
        name="description"
        content="Experience the modern trading journal web terminal. Zero-knowledge privacy, continuous ledger, dynamic Recharts, Monte Carlo forecasting, and ExcelJS live-formula workbooks."
      />
      <link rel="canonical" href="https://liber-journal.vercel.app/info" />
      <link rel="preload" as="image" href="/assets/info/terminal-hero.png" fetchPriority="high" />
      <meta name="robots" content="index, follow, max-image-preview:large" />

      {/* GEO Location Tags */}
      <meta name="geo.region" content="US;UA;EU;GLOBAL" />
      <meta name="geo.placename" content="Global" />
      <meta name="ICBM" content="0.000, 0.000" />
      <meta name="DC.coverage" content="World" />

      {/* OpenGraph / Social Metadata */}
      <meta property="og:site_name" content="Liber Journal" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://liber-journal.vercel.app/info" />
      <meta
        property="og:title"
        content="Liber Journal — Institutional Trading Performance Terminal"
      />
      <meta
        property="og:description"
        content="Zero-knowledge privacy, continuous ledger, real-time Recharts visualizations, Monte Carlo forecasting, and formula-rich Excel exports."
      />
      <meta
        property="og:image"
        content="https://liber-journal.vercel.app/assets/info/terminal-hero.png"
      />
      <meta property="og:image:width" content="1600" />
      <meta property="og:image:height" content="1000" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://liber-journal.vercel.app/info" />
      <meta
        name="twitter:title"
        content="Liber Journal — Institutional Trading Performance Terminal"
      />
      <meta
        name="twitter:description"
        content="Zero-knowledge privacy, continuous ledger, real-time Recharts visualizations, and ExcelJS live formulas."
      />
      <meta
        name="twitter:image"
        content="https://liber-journal.vercel.app/assets/info/terminal-hero.png"
      />

      {/* Generative AI Optimization (GEO) & Machine-Readable Discovery */}
      <link
        rel="alternate"
        type="text/plain"
        href="https://liber-journal.vercel.app/llms.txt"
        title="LLM-friendly description"
      />
      <link
        rel="alternate"
        type="text/plain"
        href="https://liber-journal.vercel.app/llms-full.txt"
        title="Complete LLM specification"
      />
      <meta name="ai-content-declaration" content="human-authored" />
      <meta
        name="citation_title"
        content="Liber Journal — Quantitative Trading Terminal &amp; Performance Architecture"
      />
      <meta name="citation_author" content="Yuriy Degtyar" />
      <meta name="citation_publication_date" content="2026/01/01" />

      {/* JSON-LD Schema.org Graph */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                '@id': 'https://liber-journal.vercel.app/info#app',
                name: 'Liber Journal',
                applicationCategory: 'FinanceApplication',
                operatingSystem:
                  'All modern web browsers (PWA Offline), Windows, macOS, Linux, iOS, Android',
                browserRequirements: 'Requires modern web browser',
                codeRepository: 'https://github.com/ydegtyar/liber-journal',
                license: 'https://opensource.org/licenses/MIT',
                author: {
                  '@type': 'Person',
                  name: 'Yuriy Degtyar',
                  url: 'https://github.com/ydegtyar',
                },
                sameAs: [
                  'https://github.com/ydegtyar/liber-journal',
                  'https://www.wikidata.org/wiki/Q1048607',
                  'https://www.wikidata.org/wiki/Q2334803',
                ],
                offers: {
                  '@type': 'Offer',
                  price: '0.00',
                  priceCurrency: 'USD',
                },
                description:
                  'A high-performance client-side trading terminal web app engineered to replace fragile spreadsheets with an institutional continuous ledger, real-time risk metrics, Recharts visual suite, and live Excel formulas.',
                featureList: [
                  '100% Client-Side Privacy with local browser storage',
                  'Automatic broker CSV/TSV parser for Libertex, MT4/5, Binance, IBKR',
                  'Win Rate strictly excluding Breakeven: Wins / (Wins + Losses) * 100',
                  'Mathematical Expectancy: (WinRate * AvgWin) - ((1 - WinRate) * AvgLoss)',
                  'Profit Factor: Gross Win / abs(Gross Loss)',
                  'Monte Carlo 2,000-resample bootstrap forecasting in background Web Worker',
                  'Daily Orders Matrix table with accessible drag & drop column reordering',
                  'Dynamic formula-rich XLSX exports via ExcelJS with live recalculation',
                  '5 High-Contrast Terminal Themes (Midnight OLED, Dark, Unicorn, Light, System)',
                  'Installable PWA with 100% offline functionality via Workbox',
                ],
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Terminal',
                    item: 'https://liber-journal.vercel.app/',
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Presentation & Documentation',
                    item: 'https://liber-journal.vercel.app/info',
                  },
                ],
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://liber-journal.vercel.app/info#faq',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Is Liber Journal completely private and client-side?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Liber Journal is a zero-knowledge terminal that runs 100% inside your browser using encrypted local browser storage. No trade records or portfolio figures are ever uploaded to any server or cloud database.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How does Liber Journal calculate Win Rate?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Win Rate is calculated as Wins / (Wins + Losses) * 100, excluding Breakeven trades (PnL = 0) from the denominator to avoid dilution. Breakeven trades are tracked as a separate quantitative metric.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Can Liber Journal be used offline?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. It is an installable PWA with Workbox service worker caching. All calculations, parsing, charts, and Excel exports work with complete feature parity offline.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      {/* Ambient background glowing orbs & grid */}
      <div className="info-bg-ambient" aria-hidden="true">
        <div className="info-orb info-orb-1" />
        <div className="info-orb info-orb-2" />
        <div className="info-orb info-orb-3" />
        <div className="info-grid-overlay" />
      </div>

      {/* Sticky Navigation Header */}
      <header className="info-header">
        <nav className="info-nav-container" aria-label="Main Navigation">
          <Link to="/" className="info-brand" title="Liber Journal Home">
            <Logo size={28} />
            <div>
              <span className="info-brand-name">Liber Journal</span>
            </div>
            <span className="info-brand-tag">Terminal v1.0</span>
          </Link>

          <ul className="info-nav-links">
            <li>
              <a href="#features" className="info-nav-link">
                Features
              </a>
            </li>
            <li>
              <a href="#visualizations" className="info-nav-link">
                Visualizations
              </a>
            </li>
            <li>
              <a href="#simulator" className="info-nav-link">
                Edge Simulator
              </a>
            </li>
            <li>
              <a href="#privacy" className="info-nav-link">
                Architecture
              </a>
            </li>
            <li>
              <a href="#faq" className="info-nav-link">
                FAQ
              </a>
            </li>
          </ul>

          <div className="info-nav-actions">
            <Link to="/" className="info-btn-launch" id="nav-launch-btn">
              <span>Launch Terminal</span>
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="info-hero">
          <div className="info-hero-badge">
            <span className="info-hero-badge-pulse" />
            <span>Zero-Knowledge Privacy · Client-Side Execution · Offline PWA</span>
          </div>

          <h1 className="info-hero-title">
            Precision Trading Analytics. <br />
            <span className="info-hero-gradient-text">Without Fragile Spreadsheets.</span>
          </h1>

          <p className="info-hero-subtitle">
            Engineered for quantitative discipline. Import broker CSV exports into a continuous
            ledger, calculate institutional risk metrics with pure math, project trajectories with
            Monte Carlo simulations, and export formula-rich Excel workbooks that recalculate on the
            fly.
          </p>

          <div className="info-hero-cta-group">
            <Link
              to="/"
              className="info-btn-launch"
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <span>Launch Live Terminal</span>
              <ArrowForwardIcon sx={{ fontSize: 18 }} />
            </Link>
            <a
              href="#features"
              className="info-btn-secondary"
              style={{ padding: '12px 24px', fontSize: '1rem' }}
            >
              <span>Explore Features</span>
            </a>
          </div>
        </section>

        {/* Live Performance & Spec Ticker */}
        <div className="info-ticker-bar" aria-hidden="true">
          <div className="info-ticker-track">
            <div className="info-ticker-item">
              <ShieldOutlinedIcon sx={{ fontSize: 16, color: 'var(--info-secondary)' }} />
              <span>100% Client-Side Privacy &amp; Local Storage</span>
              <span className="info-ticker-separator">/</span>
            </div>
            <div className="info-ticker-item">
              <TrendingUpIcon sx={{ fontSize: 16, color: 'var(--info-gain)' }} />
              <span>Win Rate (Excludes Breakeven Trades)</span>
              <span className="info-ticker-separator">/</span>
            </div>
            <div className="info-ticker-item">
              <ShowChartOutlinedIcon sx={{ fontSize: 16, color: 'var(--info-primary)' }} />
              <span>Interactive Recharts Visual Suite</span>
              <span className="info-ticker-separator">/</span>
            </div>
            <div className="info-ticker-item">
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 16, color: 'var(--info-secondary)' }} />
              <span>Monte Carlo 2,000 Resamples Bootstrap</span>
              <span className="info-ticker-separator">/</span>
            </div>
            <div className="info-ticker-item">
              <FileDownloadOutlinedIcon sx={{ fontSize: 16, color: 'var(--info-primary)' }} />
              <span>Dynamic Live Formula ExcelJS XLSX</span>
              <span className="info-ticker-separator">/</span>
            </div>
            <div className="info-ticker-item">
              <PaletteOutlinedIcon sx={{ fontSize: 16, color: 'var(--info-secondary)' }} />
              <span>5 High-Contrast Institutional Themes</span>
              <span className="info-ticker-separator">/</span>
            </div>
            <div className="info-ticker-item">
              <WifiOffOutlinedIcon sx={{ fontSize: 16, color: 'var(--info-gain)' }} />
              <span>PWA Offline Parity via Workbox</span>
              <span className="info-ticker-separator">/</span>
            </div>
          </div>
        </div>

        {/* Interactive 3D Terminal Preview Card */}
        <div className="info-preview-container">
          <div className="info-preview-window">
            <div className="info-preview-topbar">
              <div className="info-window-dots">
                <span className="info-window-dot info-dot-red" />
                <span className="info-window-dot info-dot-yellow" />
                <span className="info-window-dot info-dot-green" />
              </div>

              {/* Theme switcher tabs */}
              <div className="info-theme-tabs" role="tablist">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    role="tab"
                    aria-selected={activeThemeTab === theme.id}
                    className={`info-theme-tab ${activeThemeTab === theme.id ? 'active' : ''}`}
                    onClick={() => {
                      startTransition(() => setActiveThemeTab(theme.id));
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>

              <Link to="/" className="info-brand-tag" style={{ textDecoration: 'none' }}>
                LIVE DEMO ↗
              </Link>
            </div>

            <div className="info-preview-media">
              <img
                src={activeImage}
                alt="Liber Journal Trading Terminal Preview"
                className="info-preview-img"
                width={1273}
                height={566}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>

        {/* Features Bento Grid Section */}
        <section id="features" className="info-section">
          <div className="info-section-header">
            <span className="info-section-eyebrow">Institutional Architecture</span>
            <h2 className="info-section-title">Nine Integrated Analytical Modules</h2>
            <p className="info-section-subtitle">
              Every card, chart, and ledger is built as an independent modular block that can be
              freely reordered via accessible drag-and-drop or toggled based on your desk workflow.
            </p>
          </div>

          <div className="info-bento-grid">
            {/* Block 1: Timeframe & Banner */}
            <article className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <SpeedOutlinedIcon />
              </div>
              <h3 className="info-card-title">Timeframe &amp; KPI Banner</h3>
              <p className="info-card-desc">
                Instant macro overview of active trading period (Day, Week, Month, Year, All-Time,
                Custom). Real-time deposit quick-editor and monthly profit target progress tracking.
              </p>
            </article>

            {/* Block 2: Quantitative Risk Metrics */}
            <article className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <BarChartOutlinedIcon />
              </div>
              <h3 className="info-card-title">Quantitative Edge Metrics</h3>
              <p className="info-card-desc">
                Institutional metrics computed via pure math formulas: Win Rate (excluding
                Breakeven), dedicated Breakeven Rate, Profit Factor, Mathematical Expectancy, and
                Average Win/Loss ratio.
              </p>
            </article>

            {/* Block 3: Period Insights */}
            <article className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <AutoAwesomeOutlinedIcon />
              </div>
              <h3 className="info-card-title">Automated Edge Insights</h3>
              <p className="info-card-desc">
                Automated algorithmic observations detecting trading discipline, peak risk exposure,
                session strengths, and period-over-period performance acceleration.
              </p>
            </article>

            {/* Block 4: Interactive Visual Suite */}
            <article className="info-bento-card info-card-col-6">
              <div className="info-card-icon">
                <ShowChartOutlinedIcon />
              </div>
              <h3 className="info-card-title">Five Interactive Visualizations</h3>
              <p className="info-card-desc">
                Smooth 60fps responsive charts: Cumulative Running Equity Curve, Periodic Net
                P&amp;L bars (color-coded by gain/loss/breakeven), Day-of-Week edge distribution,
                Underwater Drawdown area chart, and Symbol comparison.
              </p>
            </article>

            {/* Block 5: Daily Orders Matrix */}
            <article className="info-bento-card info-card-col-6">
              <div className="info-card-icon">
                <TableChartOutlinedIcon />
              </div>
              <h3 className="info-card-title">Daily Orders Matrix &amp; 1-Click TSV Copy</h3>
              <p className="info-card-desc">
                Direct visual layout of the daily spreadsheet format. Each day displays closed order
                count, sequential trade P&amp;Ls, and daily total. Features 1-click TSV clipboard
                copy and drag-and-drop column reordering.
              </p>
            </article>

            {/* Block 6: Performance Forecast & Scenarios */}
            <article className="info-bento-card info-card-col-8">
              <div className="info-card-icon">
                <TrendingUpIcon />
              </div>
              <h3 className="info-card-title">Predictive Monte Carlo &amp; Scenario Forecasting</h3>
              <p className="info-card-desc">
                Four statistical methodologies (Monte Carlo 2,000 bootstrap resampling, OLS linear
                regression, rolling run-rate, and compounding geometric rate). Generates
                Conservative (10th percentile), Average (50th percentile), and Optimistic (90th
                percentile) fan charts offloaded to background threads.
              </p>
            </article>

            {/* Block 7: Streak Analysis */}
            <article className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <LayersOutlinedIcon />
              </div>
              <h3 className="info-card-title">Consecutive Streak Analysis</h3>
              <p className="info-card-desc">
                Tracks active runs and historical records of winning, losing, and breakeven streaks
                to combat tilt and maintain psychological discipline.
              </p>
            </article>
          </div>
        </section>

        {/* Visualizations Carousel / Showcase */}
        <section id="visualizations" className="info-section">
          <div className="info-section-header">
            <span className="info-section-eyebrow">Real-Time Data Optics</span>
            <h2 className="info-section-title">Institutional Visual Intelligence</h2>
            <p className="info-section-subtitle">
              Interactive charts powered by Recharts render running equity curves, drawdown
              underwater depths, and trading day distributions with sub-millisecond responsiveness.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            <div className="info-bento-card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#fff' }}>
                Interactive Charting Demo
              </h3>
              <div
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--info-border)',
                }}
              >
                <picture>
                  <source srcSet="/assets/info/equity-curve-interactive.webp" type="image/webp" />
                  <img
                    src="/assets/info/equity-curve-interactive.gif"
                    alt="Interactive Equity Curve Animation showing hover tooltip metrics and zoom"
                    width={800}
                    height={450}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      aspectRatio: '800 / 450',
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <p
                style={{ fontSize: '0.85rem', color: 'var(--info-text-muted)', marginTop: '12px' }}
              >
                Hovering reveals exact closed deal metrics, timestamps, and balance peaks in tabular
                format.
              </p>
            </div>

            <div className="info-bento-card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#fff' }}>
                Five Adaptive Themes
              </h3>
              <div
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--info-border)',
                }}
              >
                <img
                  src="/assets/info/theme-morph.gif"
                  alt="Theme Transition Morphing across 5 institutional color schemes"
                  width={960}
                  height={540}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    aspectRatio: '960 / 540',
                  }}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p
                style={{ fontSize: '0.85rem', color: 'var(--info-text-muted)', marginTop: '12px' }}
              >
                Seamless instant transitions across Dark, Midnight OLED, Unicorn Synthwave, Light,
                and System.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Edge Simulator Section */}
        <section id="simulator" className="info-section">
          <div className="info-section-header">
            <span className="info-section-eyebrow">Quantitative Edge Playground</span>
            <h2 className="info-section-title">Simulate Your Mathematical Advantage</h2>
            <p className="info-section-subtitle">
              Adjust your trading parameters below to instantly calculate Mathematical Expectancy
              ($), Profit Factor, and projected monthly growth according to the pure formulas in{' '}
              <code>SPEC.md</code>.
            </p>
          </div>

          <div className="info-sim-box">
            <div className="info-sim-grid">
              <div className="info-sim-controls">
                <div className="info-sim-group">
                  <div className="info-sim-label">
                    <label htmlFor="sim-capital-input">Starting Capital ($)</label>
                    <span className="info-sim-val">${simCapital.toLocaleString()}</span>
                  </div>
                  <input
                    id="sim-capital-input"
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={simCapital}
                    onChange={(e) => setSimCapital(Number(e.target.value))}
                    aria-label="Starting Capital in Dollars"
                    className="info-sim-range"
                  />
                </div>

                <div className="info-sim-group">
                  <div className="info-sim-label">
                    <label htmlFor="sim-winrate-input">Win Rate (% excluding BE)</label>
                    <span className="info-sim-val">{simWinRate}%</span>
                  </div>
                  <input
                    id="sim-winrate-input"
                    type="range"
                    min="35"
                    max="90"
                    step="1"
                    value={simWinRate}
                    onChange={(e) => setSimWinRate(Number(e.target.value))}
                    aria-label="Win Rate percentage excluding breakeven"
                    className="info-sim-range"
                  />
                </div>

                <div className="info-sim-group">
                  <div className="info-sim-label">
                    <label htmlFor="sim-rr-input">Risk-to-Reward Ratio (R:R)</label>
                    <span className="info-sim-val">1 : {simRiskReward.toFixed(1)}</span>
                  </div>
                  <input
                    id="sim-rr-input"
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={simRiskReward}
                    onChange={(e) => setSimRiskReward(Number(e.target.value))}
                    aria-label="Risk to Reward Ratio"
                    className="info-sim-range"
                  />
                </div>

                <div className="info-sim-group">
                  <div className="info-sim-label">
                    <label htmlFor="sim-volume-input">Monthly Trade Volume</label>
                    <span className="info-sim-val">{simTradesPerMonth} trades/mo</span>
                  </div>
                  <input
                    id="sim-volume-input"
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={simTradesPerMonth}
                    onChange={(e) => setSimTradesPerMonth(Number(e.target.value))}
                    aria-label="Estimated monthly closed trades volume"
                    className="info-sim-range"
                  />
                </div>
              </div>

              <div className="info-sim-results">
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--info-font-mono)',
                      color: 'var(--info-secondary)',
                    }}
                  >
                    SIMULATED RUNNING CURVE
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--info-text-muted)' }}>
                    12 Period Projection
                  </span>
                </div>

                {/* Dynamic SVG Mini Equity Curve */}
                <div style={{ height: '80px', width: '100%', position: 'relative' }}>
                  <svg
                    viewBox="0 0 280 80"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00f5d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={`${simMetrics.svgPath} L 280 80 L 0 80 Z`} fill="url(#simGrad)" />
                    <path d={simMetrics.svgPath} fill="none" stroke="#00f5d4" strokeWidth="2.5" />
                  </svg>
                </div>

                <div className="info-sim-metric">
                  <span className="info-sim-metric-name">Mathematical Expectancy / Trade</span>
                  <span
                    className={`info-sim-metric-val ${simMetrics.expectancy >= 0 ? 'gain' : ''}`}
                  >
                    {simMetrics.expectancy >= 0 ? '+' : ''}${simMetrics.expectancy.toFixed(2)}
                  </span>
                </div>

                <div className="info-sim-metric">
                  <span className="info-sim-metric-name">Simulated Profit Factor</span>
                  <span className="info-sim-metric-val gain">
                    {simMetrics.profitFactor.toFixed(2)}
                  </span>
                </div>

                <div className="info-sim-metric">
                  <span className="info-sim-metric-name">Projected Monthly Net P&amp;L</span>
                  <span className="info-sim-metric-val gain">
                    +$
                    {simMetrics.monthlyNetPnl.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="info-sim-metric">
                  <span className="info-sim-metric-name">Expected Monthly ROI</span>
                  <span className="info-sim-metric-val gain">
                    +{simMetrics.monthlyRoi.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="info-sim-disclaimer">
              <span className="info-sim-disclaimer-badge">HYPOTHETICAL PERFORMANCE NOTICE</span>
              <p>
                Calculations above represent theoretical mathematical projections derived from
                user-defined probability formulas (
                <code>Expectancy = Win% &times; AvgWin &minus; Loss% &times; AvgLoss</code>).
                Simulated or hypothetical results have inherent limitations, do not represent actual
                market trading, and cannot account for slippage, broker spreads, liquidity shocks,
                execution latency, or psychological factors. Liber Journal is an analytics tool and
                does not guarantee future returns.
              </p>
            </div>
          </div>
        </section>

        {/* Zero-Knowledge Privacy & Architecture Section */}
        <section id="privacy" className="info-section">
          <div className="info-section-header">
            <span className="info-section-eyebrow">Zero-Knowledge Security</span>
            <h2 className="info-section-title">Your Trades Never Leave Your Browser</h2>
            <p className="info-section-subtitle">
              Unlike cloud-hosted SaaS journals that monetize your private strategies or store your
              financial history on third-party servers, Liber Journal is 100% client-side.
            </p>
          </div>

          <div className="info-bento-grid">
            <div className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <LockOutlinedIcon />
              </div>
              <h3 className="info-card-title">Local Browser Storage</h3>
              <p className="info-card-desc">
                All records, broker deals, notes, and custom setups are stored securely inside your
                browser&apos;s local database. Zero database accounts, zero passwords, zero remote
                tracking.
              </p>
            </div>

            <div className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <WifiOffOutlinedIcon />
              </div>
              <h3 className="info-card-title">Full Offline Functionality</h3>
              <p className="info-card-desc">
                Registered as an installable Progressive Web App (PWA) with intelligent offline
                caching. Analyze your trades on an airplane, off-grid, or during network disruptions
                with complete parity.
              </p>
            </div>

            <div className="info-bento-card info-card-col-4">
              <div className="info-card-icon">
                <FileDownloadOutlinedIcon />
              </div>
              <h3 className="info-card-title">Dynamic Excel Export</h3>
              <p className="info-card-desc">
                Generates native multi-sheet Excel files (.xlsx) with live calculated formulas (
                <code>=SUM</code>, <code>=COUNT</code>, named range <code>InitialDeposit</code>).
                Edit any cell in Excel and the entire workbook recalculates automatically.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="info-section">
          <div className="info-section-header">
            <span className="info-section-eyebrow">Clear Answers</span>
            <h2 className="info-section-title">Frequently Asked Questions</h2>
            <p className="info-section-subtitle">
              Everything you need to know about the terminal architecture, supported formats, and
              privacy.
            </p>
          </div>

          <div className="info-faq-list">
            <details className="info-faq-item">
              <summary className="info-faq-summary">
                <span>Is my financial trading data uploaded to any remote server?</span>
                <span className="info-faq-icon">+</span>
              </summary>
              <div className="info-faq-content">
                No. Liber Journal is a zero-backend, client-side application. When you drop a broker
                CSV file, it is parsed directly inside your browser and stored in your local browser
                storage. No third-party servers ever touch your trading data.
              </div>
            </details>

            <details className="info-faq-item">
              <summary className="info-faq-summary">
                <span>Which broker CSV export formats are supported?</span>
                <span className="info-faq-icon">+</span>
              </summary>
              <div className="info-faq-content">
                Libertex exports (both Ukrainian and English formats), MetaTrader 4, MetaTrader 5,
                Interactive Brokers, Binance, Bybit, and generic tabular CSV/TSV formats. The parser
                automatically skips pre-header banners, normalizes number formats, and validates
                checksums against broker footer totals.
              </div>
            </details>

            <details className="info-faq-item">
              <summary className="info-faq-summary">
                <span>Why does Win Rate exclude Breakeven trades?</span>
                <span className="info-faq-icon">+</span>
              </summary>
              <div className="info-faq-content">
                Traditional retail formulas dilute win rate by counting breakeven trades as losses
                or artificially inflating the denominator. Liber Journal follows institutional
                quantitative standards: Win Rate = <code>Wins / (Wins + Losses) * 100</code>, while
                explicitly displaying Breakeven Count and Breakeven Rate as a dedicated risk metric.
              </div>
            </details>

            <details className="info-faq-item">
              <summary className="info-faq-summary">
                <span>How does the dynamic Excel (.xlsx) export work?</span>
                <span className="info-faq-icon">+</span>
              </summary>
              <div className="info-faq-content">
                Rather than dumping static numbers, the export engine writes native Excel formulas.
                The Daily Orders Matrix features dynamic <code>=COUNT(...)</code> and{' '}
                <code>=SUM(...)</code> formulas, named ranges, and bilingual explanatory notes.
                Modifying any trade in Excel or Google Sheets automatically updates daily, weekly,
                and monthly totals.
              </div>
            </details>

            <details className="info-faq-item">
              <summary className="info-faq-summary">
                <span>Can I customize the dashboard layout and block order?</span>
                <span className="info-faq-icon">+</span>
              </summary>
              <div className="info-faq-content">
                Yes. All 9 dashboard blocks can be rearranged via accessible drag-and-drop
                (supporting both mouse and keyboard navigation). You can toggle individual block
                visibility, and your layout sequence persists automatically in your browser.
              </div>
            </details>
          </div>
        </section>

        {/* Bottom Conversion CTA */}
        <section className="info-cta-section">
          <div className="info-cta-container">
            <h2 className="info-cta-title">Ready to Upgrade Your Trading Discipline?</h2>
            <p className="info-cta-subtitle">
              No account creation required. Drop your broker statement and experience institutional
              performance analytics in seconds.
            </p>
            <Link
              to="/"
              className="info-btn-launch"
              style={{ padding: '14px 36px', fontSize: '1.0625rem' }}
              id="cta-launch-terminal-btn"
            >
              <span>Launch Trading Terminal</span>
              <ArrowForwardIcon sx={{ fontSize: 20 }} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="info-footer">
        <div className="info-footer-container">
          <div className="info-footer-top">
            <div className="info-footer-brand">
              <span className="info-footer-brand-title">Liber Journal</span>
              <span className="info-footer-brand-desc">
                Institutional Performance &amp; Quantitative Trading Analytics Terminal
              </span>
            </div>

            <ul className="info-footer-links">
              <li>
                <Link to="/">Launch Terminal</Link>
              </li>
              <li>
                <a
                  href="https://github.com/ydegtyar/liber-journal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#visualizations">Visualizations</a>
              </li>
              <li>
                <a href="#simulator">Edge Simulator</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
              <li>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--info-secondary)' }}
                >
                  llms.txt (AI Specs)
                </a>
              </li>
              <li>
                <a
                  href="/llms-full.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--info-primary)' }}
                >
                  llms-full.txt
                </a>
              </li>
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                  Sitemap
                </a>
              </li>
            </ul>
          </div>

          <hr className="info-footer-divider" />

          {/* Regulatory Compliance & Risk Disclosures */}
          <div className="info-footer-compliance-wrapper">
            <h2 className="info-footer-compliance-title">
              Regulatory Disclosures &amp; Compliance Standards
            </h2>
            <div className="info-footer-compliance">
              <div className="info-compliance-col">
                <h3>Financial Risk Disclosure</h3>
                <p>
                  Trading foreign exchange (Forex), contracts for difference (CFDs), stocks,
                  futures, and cryptocurrencies carries a high degree of risk to your capital and is
                  not appropriate for all investors. Leveraged products can result in losses that
                  exceed initial deposits. You should carefully evaluate your trading objectives,
                  experience level, and risk tolerance prior to engaging in speculative trading.
                  Past performance or mathematical simulations do not guarantee future market
                  returns.
                </p>
              </div>

              <div className="info-compliance-col">
                <h3>Non-Investment Advisory Notice</h3>
                <p>
                  Liber Journal is a standalone, client-side analytical software application
                  designed for recordkeeping and trade journal discipline. Liber Journal is not a
                  registered broker-dealer, investment advisor, or commodity trading advisor. No
                  calculations, visualizations, forecasts, or documentation provided within this
                  application constitute financial, investment, legal, or tax advice.
                </p>
              </div>

              <div className="info-compliance-col">
                <h3>Zero Dark Patterns &amp; Privacy Guarantee</h3>
                <p>
                  Liber Journal is 100% free and open-source software distributed under the MIT
                  License. We do not require credit cards, create accounts, charge subscriptions, or
                  employ deceptive countdowns or fake urgency. We do not set tracking cookies or
                  collect user telemetry. All broker files and portfolio balances are stored
                  exclusively inside your device&apos;s local browser storage.
                </p>
              </div>
            </div>
          </div>

          <div className="info-footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} Liber Journal. Open-source under the MIT License.
            </div>
            <div className="info-footer-meta-tags">
              <span>Client-Side Local Storage</span> &middot; <span>Zero Telemetry</span> &middot;{' '}
              <span>Progressive Web App</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InfoPage;
