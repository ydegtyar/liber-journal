import React, { useState, useCallback, useRef, useEffect, useId } from 'react';
import { Box, SxProps, Theme } from '@mui/material';

export interface LogoProps {
  /** Size in pixels, or responsive MUI sx object. Default is { xs: 24, sm: 28 } */
  size?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  /** Additional custom MUI Sx styling */
  sx?: SxProps<Theme>;
  /** Optional click handler invoked alongside the animation */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  /** Accessible label */
  ariaLabel?: string;
  /** Component class name */
  className?: string;
}

export const Logo: React.FC<LogoProps> = React.memo(
  ({ size, sx, onClick, ariaLabel = 'Trading Journal Logo', className }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const tlRef = useRef<{ kill: () => void } | null>(null);

    // References for GSAP timeline targets
    const containerRef = useRef<HTMLDivElement>(null);
    const candle1Ref = useRef<SVGGElement>(null);
    const candle2Ref = useRef<SVGGElement>(null);
    const candle3Ref = useRef<SVGGElement>(null);
    const astronautRef = useRef<SVGGElement>(null);
    const leftLegRef = useRef<SVGGElement>(null);
    const rightLegRef = useRef<SVGGElement>(null);
    const sparklesRef = useRef<SVGGElement>(null);
    const trendLineRef = useRef<SVGPathElement>(null);

    const rawId = useId();
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

    const bgGradId = `logo-bgGrad-${id}`;
    const bullGradId = `logo-bullGrad-${id}`;
    const trendGradId = `logo-trendGrad-${id}`;
    const glowId = `logo-glow-${id}`;

    // Clean up any ongoing GSAP timeline on unmount
    useEffect(() => {
      return () => {
        if (tlRef.current) {
          tlRef.current.kill();
        }
      };
    }, []);

    const handleTrigger = useCallback(
      async (event: React.MouseEvent<HTMLElement>) => {
        onClick?.(event);

        if (tlRef.current) {
          tlRef.current.kill();
        }

        setIsAnimating(true);

        // Lazy-load GSAP library strictly on demand after click
        const gsapModule = await import('gsap');
        const gsap = gsapModule.gsap || gsapModule.default || gsapModule;

        // Ensure DOM elements are mounted before playing timeline
        requestAnimationFrame(() => {
          if (!astronautRef.current || !candle1Ref.current) return;

          const tl = gsap.timeline({
            onComplete: () => {
              setIsAnimating(false);
              tlRef.current = null;
            },
          });
          tlRef.current = tl;

          // Slightly enhance logo scale and subtle cosmic glow during the astronaut climb
          if (containerRef.current) {
            tl.to(
              containerRef.current,
              {
                scale: 1.45,
                duration: 0.35,
                ease: 'power2.out',
              },
              0
            );
          }

          // Initial positions
          tl.set(astronautRef.current, {
            x: 14,
            y: 0,
            opacity: 0,
            scale: 0.5,
          });
          tl.set(sparklesRef.current, { opacity: 0, scale: 0.3 });

          // 1. Candlesticks rise up like stair steps
          tl.from(
            [candle1Ref.current, candle2Ref.current, candle3Ref.current],
            {
              scaleY: 0.1,
              transformOrigin: 'bottom center',
              duration: 0.4,
              stagger: 0.08,
              ease: 'back.out(1.8)',
            },
            0.05
          );

          // 2. Ascending Trendline draws underneath
          if (trendLineRef.current) {
            tl.fromTo(
              trendLineRef.current,
              { strokeDashoffset: 100 },
              { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out' },
              0.1
            );
          }

          // 3. Astronaut beams down onto Candle 1 (First step)
          tl.to(
            astronautRef.current,
            {
              y: 16,
              opacity: 1,
              scale: 1,
              duration: 0.35,
              ease: 'back.out(2)',
            },
            0.2
          );

          // Candle 1 squashes under astronaut landing
          tl.to(
            candle1Ref.current,
            {
              scaleY: 0.88,
              duration: 0.12,
              yoyo: true,
              repeat: 1,
              transformOrigin: 'bottom center',
            },
            0.45
          );

          // 4. Astronaut takes a leap & steps up to Candle 2 (Middle step)
          tl.to(
            astronautRef.current,
            {
              x: 32,
              y: 6,
              duration: 0.42,
              ease: 'power1.inOut',
            },
            0.6
          );

          // Leg running motion
          if (rightLegRef.current && leftLegRef.current) {
            tl.to(
              rightLegRef.current,
              {
                rotation: 30,
                transformOrigin: 'top center',
                duration: 0.2,
                yoyo: true,
                repeat: 1,
              },
              0.6
            );
            tl.to(
              leftLegRef.current,
              {
                rotation: -25,
                transformOrigin: 'top center',
                duration: 0.2,
                yoyo: true,
                repeat: 1,
              },
              0.6
            );
          }

          // Candle 2 squashes under landing
          tl.to(
            candle2Ref.current,
            {
              scaleY: 0.88,
              duration: 0.12,
              yoyo: true,
              repeat: 1,
              transformOrigin: 'bottom center',
            },
            0.95
          );

          // 5. Astronaut leaps up to Candle 3 (Peak step)
          tl.to(
            astronautRef.current,
            {
              x: 50,
              y: -4,
              duration: 0.42,
              ease: 'power1.inOut',
            },
            1.1
          );

          // Leg running motion 2
          if (rightLegRef.current && leftLegRef.current) {
            tl.to(
              rightLegRef.current,
              {
                rotation: 35,
                transformOrigin: 'top center',
                duration: 0.2,
                yoyo: true,
                repeat: 1,
              },
              1.1
            );
            tl.to(
              leftLegRef.current,
              {
                rotation: -25,
                transformOrigin: 'top center',
                duration: 0.2,
                yoyo: true,
                repeat: 1,
              },
              1.1
            );
          }

          // Candle 3 squashes under landing
          tl.to(
            candle3Ref.current,
            {
              scaleY: 0.88,
              duration: 0.12,
              yoyo: true,
              repeat: 1,
              transformOrigin: 'bottom center',
            },
            1.45
          );

          // 6. Apex Celebration: Astronaut reaches the top & leaps towards the moon!
          tl.to(
            astronautRef.current,
            {
              y: -18,
              scale: 1.15,
              rotation: 10,
              duration: 0.35,
              ease: 'power2.out',
            },
            1.6
          );

          // Golden stars & sparkles burst at apex
          tl.to(
            sparklesRef.current,
            {
              opacity: 1,
              scale: 1.6,
              transformOrigin: 'center center',
              duration: 0.25,
              ease: 'back.out(2)',
            },
            1.7
          );

          // 7. Astronaut rockets up into the cosmos
          tl.to(
            astronautRef.current,
            {
              y: -40,
              opacity: 0,
              scale: 0.4,
              duration: 0.4,
              ease: 'power2.in',
            },
            2.0
          );
          tl.to(
            sparklesRef.current,
            {
              opacity: 0,
              duration: 0.3,
            },
            2.0
          );

          // Reset container scale smoothly to resting state
          if (containerRef.current) {
            tl.to(
              containerRef.current,
              {
                scale: 1,
                duration: 0.35,
                ease: 'power2.inOut',
              },
              2.05
            );
          }
        });
      },
      [onClick]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleTrigger(event as unknown as React.MouseEvent<HTMLElement>);
        }
      },
      [handleTrigger]
    );

    const defaultDimensions = size
      ? typeof size === 'number'
        ? { width: size, height: size }
        : { width: size, height: size }
      : { width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 } };

    return (
      <Box
        ref={containerRef}
        component="div"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={handleTrigger}
        onKeyDown={handleKeyDown}
        className={className}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
          userSelect: 'none',
          outline: 'none',
          overflow: 'visible',
          lineHeight: 0,
          position: 'relative',
          zIndex: isAnimating ? 1300 : 1,
          transition: isAnimating
            ? 'none'
            : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease',
          '&:hover': isAnimating
            ? {}
            : {
                transform: 'scale(1.08)',
                filter: 'drop-shadow(0 0 6px rgba(0, 245, 212, 0.45))',
              },
          '&:active': isAnimating
            ? {}
            : {
                transform: 'scale(0.95)',
              },
          '&:focus-visible': {
            boxShadow: '0 0 0 2px #00F5D4',
            borderRadius: '14px',
          },
          ...defaultDimensions,
          ...sx,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          width="100%"
          height="100%"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E121A" />
              <stop offset="100%" stopColor="#05070A" />
            </linearGradient>
            <linearGradient id={bullGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00F5D4" />
              <stop offset="100%" stopColor="#00C853" />
            </linearGradient>
            <linearGradient id={trendGradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#388BFD" />
              <stop offset="100%" stopColor="#00F5D4" />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Base Badge */}
          <rect
            x="2"
            y="2"
            width="60"
            height="60"
            rx="14"
            fill={`url(#${bgGradId})`}
            stroke={isAnimating ? '#00F5D4' : '#30363D'}
            strokeWidth="2"
            style={{
              transition: 'stroke 0.3s ease',
            }}
          />

          {!isAnimating ? (
            /* ============================================================ */
            /* Static Resting State: Exact brand SVG identical to favicon  */
            /* ============================================================ */
            <g id="static-logo-elements">
              {/* Candlestick 1: Bearish candle (left) */}
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="44"
                stroke="#F85149"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect x="16" y="25" width="8" height="13" rx="2" fill="#F85149" />

              {/* Candlestick 2: Bullish candle (right) */}
              <line
                x1="44"
                y1="12"
                x2="44"
                y2="38"
                stroke="#00F5D4"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect x="40" y="16" width="8" height="16" rx="2" fill={`url(#${bullGradId})`} />

              {/* Dynamic Ascending Equity Line */}
              <path
                d="M 12 46 L 24 36 L 36 40 L 52 14"
                fill="none"
                stroke={`url(#${trendGradId})`}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
              />

              {/* Glowing Head Point */}
              <circle cx="52" cy="14" r="3" fill="#FFFFFF" stroke="#00F5D4" strokeWidth="1.5" />
            </g>
          ) : (
            /* ============================================================ */
            /* Animated State: Astronaut climbing up the candles to the moon */
            /* ============================================================ */
            <g id="astronaut-climb-stage">
              {/* Ascending Trend Line */}
              <path
                ref={trendLineRef}
                d="M 8 46 L 22 36 L 36 28 L 52 14"
                fill="none"
                stroke={`url(#${trendGradId})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={0}
                filter={`url(#${glowId})`}
              />

              {/* Candlestick 1: Step 1 (Left) */}
              <g ref={candle1Ref} style={{ transformBox: 'fill-box' }}>
                <line
                  x1="14"
                  y1="28"
                  x2="14"
                  y2="54"
                  stroke="#00C853"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="10"
                  y="34"
                  width="8"
                  height="16"
                  rx="2"
                  fill="url(#bullGrad)"
                  stroke="#0E121A"
                  strokeWidth="1"
                />
              </g>

              {/* Candlestick 2: Step 2 (Middle) */}
              <g ref={candle2Ref} style={{ transformBox: 'fill-box' }}>
                <line
                  x1="32"
                  y1="18"
                  x2="32"
                  y2="48"
                  stroke="#00C853"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="28"
                  y="24"
                  width="8"
                  height="18"
                  rx="2"
                  fill="url(#bullGrad)"
                  stroke="#0E121A"
                  strokeWidth="1"
                />
              </g>

              {/* Candlestick 3: Step 3 (Peak) */}
              <g ref={candle3Ref} style={{ transformBox: 'fill-box' }}>
                <line
                  x1="50"
                  y1="8"
                  x2="50"
                  y2="40"
                  stroke="#00C853"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="46"
                  y="14"
                  width="8"
                  height="20"
                  rx="2"
                  fill="url(#bullGrad)"
                  stroke="#0E121A"
                  strokeWidth="1"
                />
              </g>

              {/* Golden Stars & Sparkles at Apex */}
              <g ref={sparklesRef} style={{ transformBox: 'fill-box' }}>
                {/* 4-point star 1 */}
                <path
                  d="M 52 4 L 53.5 8 L 57.5 9.5 L 53.5 11 L 52 15 L 50.5 11 L 46.5 9.5 L 50.5 8 Z"
                  fill="#FFD700"
                  filter={`url(#${glowId})`}
                />
                {/* 4-point star 2 */}
                <path
                  d="M 40 -2 L 41 1 L 44 2 L 41 3 L 40 6 L 39 3 L 36 2 L 39 1 Z"
                  fill="#00F5D4"
                />
                {/* Sparkle circles */}
                <circle cx="58" cy="18" r="1.5" fill="#FFD700" />
                <circle cx="44" cy="10" r="1.2" fill="#FFFFFF" />
              </g>

              {/* Cute Astronaut Walking Up the Candlesticks */}
              <g
                ref={astronautRef}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'center center',
                }}
              >
                {/* Backpack (Life support unit) */}
                <rect
                  x="-10"
                  y="3"
                  width="5"
                  height="12"
                  rx="2.5"
                  fill="#E2E8F0"
                  stroke="#0E121A"
                  strokeWidth="1.2"
                />

                {/* Left Leg (Trailing / Grounded) */}
                <g ref={leftLegRef} style={{ transformBox: 'fill-box' }}>
                  <path
                    d="M -5 10 L -6 18 L -2 18 L -2 10 Z"
                    fill="#FFFFFF"
                    stroke="#0E121A"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M -7 18 L -1 18 C 0 18 0 20 -2 20 L -7 20 C -8 20 -8 18 -7 18 Z"
                    fill="#334155"
                    stroke="#0E121A"
                    strokeWidth="1.2"
                  />
                </g>

                {/* Right Leg (Leading / Stepping Up) */}
                <g ref={rightLegRef} style={{ transformBox: 'fill-box' }}>
                  <path
                    d="M 0 9 L 4 12 L 4 16 L 0 14 Z"
                    fill="#FFFFFF"
                    stroke="#0E121A"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 1 16 L 7 16 C 8 16 8 18 6 18 L 1 18 C 0 18 0 16 1 16 Z"
                    fill="#334155"
                    stroke="#0E121A"
                    strokeWidth="1.2"
                  />
                </g>

                {/* Body / Torso */}
                <rect
                  x="-6"
                  y="2"
                  width="12"
                  height="11"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#0E121A"
                  strokeWidth="1.2"
                />

                {/* Chest Control Box */}
                <rect
                  x="-2.5"
                  y="4.5"
                  width="6.5"
                  height="5"
                  rx="1.5"
                  fill="#F1F5F9"
                  stroke="#0E121A"
                  strokeWidth="0.9"
                />
                <circle cx="-0.5" cy="7" r="0.9" fill="#00F5D4" />
                <circle cx="1.5" cy="7" r="0.9" fill="#388BFD" />

                {/* Left Arm (Behind) */}
                <path
                  d="M -5 4 C -8 6 -9 10 -7 12"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M -5 4 C -8 6 -9 10 -7 12"
                  fill="none"
                  stroke="#0E121A"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="-7" cy="12" r="1.8" fill="#E2E8F0" stroke="#0E121A" strokeWidth="1" />

                {/* Right Arm (Forward / Reaching) */}
                <path
                  d="M 4 4 C 7 5 8 9 7 11"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 4 4 C 7 5 8 9 7 11"
                  fill="none"
                  stroke="#0E121A"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="7" cy="11" r="1.8" fill="#E2E8F0" stroke="#0E121A" strokeWidth="1" />

                {/* Helmet */}
                <circle cx="0" cy="-5" r="8.5" fill="#FFFFFF" stroke="#0E121A" strokeWidth="1.4" />

                {/* Ear Pieces */}
                <rect
                  x="-9.5"
                  y="-7"
                  width="2"
                  height="4.5"
                  rx="1"
                  fill="#E2E8F0"
                  stroke="#0E121A"
                  strokeWidth="1"
                />
                <rect
                  x="7.5"
                  y="-7"
                  width="2"
                  height="4.5"
                  rx="1"
                  fill="#E2E8F0"
                  stroke="#0E121A"
                  strokeWidth="1"
                />

                {/* Dark Purple Visor */}
                <ellipse
                  cx="0.5"
                  cy="-5"
                  rx="6.2"
                  ry="5.5"
                  fill="#1C1236"
                  stroke="#0E121A"
                  strokeWidth="1.2"
                />

                {/* Visor Glossy Highlights */}
                <ellipse
                  cx="-2"
                  cy="-7.2"
                  rx="2.2"
                  ry="1.2"
                  fill="#FFFFFF"
                  opacity="0.9"
                  transform="rotate(-30 -2 -7.2)"
                />
                <circle cx="2.2" cy="-3.5" r="0.9" fill="#FFFFFF" opacity="0.6" />
              </g>
            </g>
          )}
        </svg>
      </Box>
    );
  }
);

Logo.displayName = 'Logo';
