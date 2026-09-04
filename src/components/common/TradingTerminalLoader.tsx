import React from 'react';
import { Box, Typography, keyframes, useTheme } from '@mui/material';

interface TradingTerminalLoaderProps {
  message?: string;
  subMessage?: string;
  minHeight?: number | string;
  variant?: 'compact' | 'standard' | 'fullscreen';
}

const candlePulse = keyframes`
  0%, 100% {
    transform: scaleY(0.4);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
`;

const scanline = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const pulseDot = keyframes`
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
`;

export const TradingTerminalLoader: React.FC<TradingTerminalLoaderProps> = ({
  message = 'INITIALIZING TERMINAL ENGINE...',
  subMessage = 'SYNCING CLIENT-SIDE LEDGER',
  minHeight = 320,
  variant = 'standard',
}) => {
  const theme = useTheme();

  const isCompact = variant === 'compact';
  const green = theme.palette.trade?.gain || '#2ea043';
  const red = theme.palette.trade?.loss || '#f85149';
  const primary = theme.palette.primary.main || '#58a6ff';

  // Candlestick configurations: [bodyH, wickH, isBullish, delaySeconds]
  const candles = [
    { bodyH: 26, wickH: 42, isGreen: true, delay: '0s' },
    { bodyH: 18, wickH: 34, isGreen: false, delay: '0.18s' },
    { bodyH: 32, wickH: 50, isGreen: true, delay: '0.36s' },
    { bodyH: 22, wickH: 38, isGreen: false, delay: '0.54s' },
    { bodyH: 38, wickH: 56, isGreen: true, delay: '0.72s' },
    { bodyH: 16, wickH: 30, isGreen: false, delay: '0.9s' },
    { bodyH: 28, wickH: 46, isGreen: true, delay: '1.08s' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        width: '100%',
        p: isCompact ? 2 : 4,
        background: `radial-gradient(ellipse at center, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      role="status"
      aria-label={message}
    >
      {/* Background Cyber Grid */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: theme.palette.mode === 'dark' ? 0.05 : 0.03,
          backgroundImage: `linear-gradient(${theme.palette.text.primary} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.text.primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* Candlestick Visualization Stage */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isCompact ? 1 : 1.75,
          height: isCompact ? 50 : 70,
          position: 'relative',
          mb: isCompact ? 1.5 : 2.5,
          px: 3,
        }}
      >
        {candles.map((c, i) => {
          const color = c.isGreen ? green : red;
          return (
            <Box
              key={i}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: isCompact ? 8 : 12,
                height: '100%',
              }}
            >
              {/* Wick */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '2px',
                  height: isCompact ? c.wickH * 0.7 : c.wickH,
                  backgroundColor: color,
                  opacity: 0.7,
                  borderRadius: 1,
                  animation: `${candlePulse} 1.6s infinite ease-in-out`,
                  animationDelay: c.delay,
                  transformOrigin: 'center center',
                }}
              />
              {/* Candle Body */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: isCompact ? c.bodyH * 0.7 : c.bodyH,
                  backgroundColor: color,
                  borderRadius: '2px',
                  boxShadow: `0 0 10px ${color}66`,
                  animation: `${candlePulse} 1.6s infinite ease-in-out`,
                  animationDelay: c.delay,
                  transformOrigin: 'center center',
                }}
              />
            </Box>
          );
        })}

        {/* Scanline / Price Ticker Line */}
        <Box
          sx={{
            position: 'absolute',
            bottom: isCompact ? 12 : 18,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
            animation: `${scanline} 2.2s infinite cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
      </Box>

      {/* Terminal Status & Typography - Locked dimensions to prevent candlestick shift on text disappearance */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isCompact ? 40 : 48,
          height: isCompact ? 40 : 48,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minHeight: isCompact ? 20 : 24,
            visibility: message ? 'visible' : 'hidden',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: green,
              boxShadow: `0 0 8px ${green}`,
              animation: `${pulseDot} 1.2s infinite ease-in-out`,
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
              fontSize: isCompact ? '0.75rem' : '0.825rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: theme.palette.text.primary,
              lineHeight: 1.2,
            }}
          >
            {message || '\u00A0'}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
            fontSize: '0.68rem',
            color: theme.palette.text.secondary,
            letterSpacing: '0.05em',
            lineHeight: 1.2,
            mt: 0.5,
            minHeight: '1.2em',
            visibility: subMessage ? 'visible' : 'hidden',
            opacity: subMessage ? 0.75 : 0,
          }}
        >
          {subMessage || '\u00A0'}
        </Typography>
      </Box>
    </Box>
  );
};
