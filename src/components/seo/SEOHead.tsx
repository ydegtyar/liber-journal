import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
}

const SITE_URL = 'https://liber-journal.vercel.app';
const DEFAULT_PREVIEW_IMG = `${SITE_URL}/pwa-512x512.png`;

export const SEOHead: React.FC<SEOHeadProps> = React.memo(
  ({ title, description, canonicalPath = '', ogType = 'website' }) => {
    const { i18n, t } = useTranslation();
    const currentLang = i18n.language?.startsWith('uk') ? 'uk' : 'en';

    const defaultTitle = `${t('app.title', 'Trading Journal')} — Institutional Performance Terminal`;
    const defaultDesc = t(
      'app.subtitle',
      'Privacy-first trading journal with real-time analytics, continuous ledger, and live-formula Excel exports'
    );

    const metaTitle = title ? `${title} | Liber Journal` : defaultTitle;
    const metaDescription = description || defaultDesc;
    const canonicalUrl = `${SITE_URL}${canonicalPath ? (canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`) : '/'}`;

    // Keep <html lang="..."> in sync with active locale for search engine parsing
    useEffect(() => {
      document.documentElement.lang = currentLang;
      document.documentElement.setAttribute('xml:lang', currentLang);
    }, [currentLang]);

    // Schema.org Graph tailored for Liber Journal
    const jsonLdGraph = useMemo(
      () => ({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            '@id': `${SITE_URL}/#webapp`,
            name: 'Liber Journal',
            url: SITE_URL,
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'All modern browsers (Web Standards)',
            description:
              'Institutional-grade client-side trading journal terminal with real-time analytics, Sharpe ratio, continuous ledger, and live-formula Excel exports.',
            inLanguage: ['en', 'uk'],
            browserRequirements: 'Requires JavaScript and IndexedDB support',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            featureList: [
              'Client-side zero-knowledge privacy with Dexie.js and IndexedDB',
              'Multi-broker CSV import (MT4/5, Interactive Brokers, Binance, Bybit)',
              'Real-time calculation of Win Rate, Profit Factor, Sharpe Ratio, and Drawdowns',
              'Dynamic Recharts equity curve and daily PnL distribution',
              'Institutional ExcelJS live-formula workbooks with dynamic monthly sheets',
            ],
          },
          {
            '@type': 'FAQPage',
            '@id': `${SITE_URL}/#faq`,
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Is my financial trading data uploaded to external servers?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No. Liber Journal runs entirely inside your browser. All trade records, notes, and metrics remain client-side in your local IndexedDB storage.',
                },
              },
              {
                '@type': 'Question',
                name: 'Which broker CSV export formats are supported?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Liber Journal supports CSV exports from MetaTrader 4, MetaTrader 5, Interactive Brokers, Binance, Bybit, and flexible custom CSV mappings.',
                },
              },
              {
                '@type': 'Question',
                name: 'Are exported Excel reports static or dynamic?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Exported spreadsheets use ExcelJS live formulas (SUM, AVERAGE, IF), allowing you to audit calculations natively in Microsoft Excel or Google Sheets.',
                },
              },
            ],
          },
        ],
      }),
      []
    );

    return (
      <>
        {/* Primary React 19 Hoisted Document Head Tags */}
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
        <link rel="canonical" href={canonicalUrl} />

        {/* Multilingual Hreflang Tags */}
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/?lang=en`} />
        <link rel="alternate" hrefLang="uk" href={`${SITE_URL}/?lang=uk`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/`} />

        {/* Open Graph / Facebook */}
        <meta property="og:site_name" content="Liber Journal" />
        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={DEFAULT_PREVIEW_IMG} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:locale" content={currentLang === 'uk' ? 'uk_UA' : 'en_US'} />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="uk_UA" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={DEFAULT_PREVIEW_IMG} />

        {/* GEO Structured Data: Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </>
    );
  }
);

SEOHead.displayName = 'SEOHead';
