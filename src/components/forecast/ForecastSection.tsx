import React, { useMemo, useTransition } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CasinoIcon from '@mui/icons-material/Casino';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MovingIcon from '@mui/icons-material/Moving';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TagIcon from '@mui/icons-material/Tag';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from 'usehooks-ts';

import { Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import {
  ForecastModelId,
  ForecastScenarioId,
  HorizonMode,
  TimeHorizonKey,
  FORECAST_STORAGE_KEYS,
} from '../../types/forecast';
import { estimateMonthlyTradesRate, getApproxTradesForTimeHorizon } from '../../lib/forecastEngine';
import { ForecastKpiCards } from './ForecastKpiCards';
import { ForecastChart } from './ForecastChart';
import { ForecastSkeleton } from './ForecastSkeleton';
import { useForecast } from './useForecast';

export interface Props {
  trades: Trade[];
  initialDeposit: number;
  currency: string;
  numberFormat: NumberFormatOption;
}

const TIME_HORIZONS: TimeHorizonKey[] = ['1m', '3m', '6m', '12m'];
const TRADES_HORIZONS: number[] = [30, 60, 90, 180];

const VALID_MODELS: ForecastModelId[] = [
  'monteCarlo',
  'linearRegression',
  'runRate',
  'compounding',
];
const VALID_HORIZON_MODES: HorizonMode[] = ['time', 'trades'];
const VALID_TIME_HORIZONS: TimeHorizonKey[] = ['1m', '3m', '6m', '12m'];
const VALID_TRADES_HORIZONS: number[] = [30, 60, 90, 180];
const VALID_SCENARIOS: ForecastScenarioId[] = ['conservative', 'average', 'optimistic'];

export const ForecastSection: React.FC<Props> = React.memo(
  ({ trades, initialDeposit, currency, numberFormat }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [, startTransition] = useTransition();

    // Persist selected forecast method (model) between sessions
    const [rawModel, setModel] = useLocalStorage<ForecastModelId>(
      FORECAST_STORAGE_KEYS.MODEL,
      'monteCarlo'
    );
    const model: ForecastModelId = VALID_MODELS.includes(rawModel) ? rawModel : 'monteCarlo';

    // Persist selected forecast horizon mode ('time' | 'trades') between sessions
    const [rawHorizonMode, setHorizonMode] = useLocalStorage<HorizonMode>(
      FORECAST_STORAGE_KEYS.HORIZON_MODE,
      'time'
    );
    const horizonMode: HorizonMode = VALID_HORIZON_MODES.includes(rawHorizonMode)
      ? rawHorizonMode
      : 'time';

    // Persist selected forecast horizon option between sessions (null by default for lazy computation)
    const [rawTimeHorizon, setTimeHorizon] = useLocalStorage<TimeHorizonKey | null>(
      FORECAST_STORAGE_KEYS.TIME_HORIZON,
      null
    );
    const timeHorizon: TimeHorizonKey | null =
      rawTimeHorizon && VALID_TIME_HORIZONS.includes(rawTimeHorizon) ? rawTimeHorizon : null;

    const [rawTradesHorizon, setTradesHorizon] = useLocalStorage<number | null>(
      FORECAST_STORAGE_KEYS.TRADES_HORIZON,
      null
    );
    const tradesHorizon: number | null =
      typeof rawTradesHorizon === 'number' && VALID_TRADES_HORIZONS.includes(rawTradesHorizon)
        ? rawTradesHorizon
        : null;

    // Persist selected forecast scenario mode ('conservative' | 'average' | 'optimistic') between sessions
    const [rawScenario, setSelectedScenario] = useLocalStorage<ForecastScenarioId>(
      FORECAST_STORAGE_KEYS.SCENARIO,
      'average'
    );
    const selectedScenario: ForecastScenarioId = VALID_SCENARIOS.includes(rawScenario)
      ? rawScenario
      : 'average';

    // Calculate historical monthly trading velocity
    const monthlyTradesRate = useMemo(() => estimateMonthlyTradesRate(trades), [trades]);

    const hasSelectedOption =
      horizonMode === 'time' ? timeHorizon !== null : tradesHorizon !== null;

    // Compute effective horizon in trade count
    const effectiveHorizon = useMemo(() => {
      if (horizonMode === 'time') {
        return timeHorizon ? getApproxTradesForTimeHorizon(monthlyTradesRate, timeHorizon) : null;
      }
      return tradesHorizon;
    }, [horizonMode, monthlyTradesRate, timeHorizon, tradesHorizon]);

    const handleModelChange = (_: React.SyntheticEvent, newModel: ForecastModelId) => {
      startTransition(() => {
        setModel(newModel);
      });
    };

    const handleHorizonModeChange = (mode: HorizonMode) => {
      startTransition(() => {
        setHorizonMode(mode);
      });
    };

    const handleTimeHorizonSelect = (th: TimeHorizonKey) => {
      startTransition(() => {
        setTimeHorizon(th);
      });
    };

    const handleTradesHorizonSelect = (th: number) => {
      startTransition(() => {
        setTradesHorizon(th);
      });
    };

    const handleScenarioSelect = (scenario: ForecastScenarioId) => {
      startTransition(() => {
        setSelectedScenario(scenario);
      });
    };

    // Memoize forecast computation options
    const forecastOptions = useMemo(
      () => ({
        horizonMode,
        timeHorizon: timeHorizon ?? undefined,
        approxMonthlyTradesRate: monthlyTradesRate,
      }),
      [horizonMode, timeHorizon, monthlyTradesRate]
    );

    const hasSufficientData = trades.length >= 2;

    // Lazily compute forecast via Web Worker with 1-hour caching & loading state
    const { forecast, isLoading } = useForecast({
      initialDeposit,
      trades,
      model,
      horizon: effectiveHorizon,
      options: forecastOptions,
      enabled: hasSelectedOption && hasSufficientData,
    });

    return (
      <section aria-label={t('forecast.title')}>
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* Top linear progress bar during background Web Worker calculation */}
          {isLoading && (
            <LinearProgress
              aria-label="Calculating forecast in background"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 2,
              }}
            />
          )}
          {/* Header: Title and Model Selector */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              pb: 1.5,
              borderBottom: (th) => `1px solid ${th.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AutoGraphIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {t('forecast.title')}
              </Typography>
            </Box>

            {/* Model Selector Tabs */}
            <Tabs
              value={model}
              onChange={handleModelChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 36,
                '& .MuiTab-root': {
                  minHeight: 36,
                  py: 0.5,
                  px: 1.25,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                },
              }}
            >
              <Tab
                value="monteCarlo"
                label={t('forecast.models.monteCarlo')}
                icon={<CasinoIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
              <Tab
                value="linearRegression"
                label={t('forecast.models.linearRegression')}
                icon={<ShowChartIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
              <Tab
                value="runRate"
                label={t('forecast.models.runRate')}
                icon={<MovingIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
              <Tab
                value="compounding"
                label={t('forecast.models.compounding')}
                icon={<CurrencyExchangeIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Controls Bar: Pretty Switch between Time & Trades + Horizon Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
              px: { xs: 1, sm: 1.5 },
              py: 1,
              borderRadius: 2,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              border: (th) => `1px solid ${th.palette.divider}`,
            }}
          >
            {/* Pretty Switch between Time and Trades */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                {t('forecast.horizons.label')}:
              </Typography>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  p: 0.4,
                  borderRadius: 2,
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.06)',
                  border: (th) => `1px solid ${th.palette.divider}`,
                }}
              >
                <Button
                  size="small"
                  onClick={() => handleHorizonModeChange('time')}
                  startIcon={<AccessTimeIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    minHeight: 28,
                    color: horizonMode === 'time' ? 'primary.contrastText' : 'text.secondary',
                    backgroundColor: horizonMode === 'time' ? 'primary.main' : 'transparent',
                    boxShadow: horizonMode === 'time' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    '&:hover': {
                      backgroundColor:
                        horizonMode === 'time'
                          ? 'primary.dark'
                          : alpha(theme.palette.text.primary, 0.05),
                    },
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {t('forecast.horizonModes.time')}
                </Button>

                <Button
                  size="small"
                  onClick={() => handleHorizonModeChange('trades')}
                  startIcon={<TagIcon sx={{ fontSize: 15 }} />}
                  sx={{
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    minHeight: 28,
                    color: horizonMode === 'trades' ? 'primary.contrastText' : 'text.secondary',
                    backgroundColor: horizonMode === 'trades' ? 'primary.main' : 'transparent',
                    boxShadow: horizonMode === 'trades' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    '&:hover': {
                      backgroundColor:
                        horizonMode === 'trades'
                          ? 'primary.dark'
                          : alpha(theme.palette.text.primary, 0.05),
                    },
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {t('forecast.horizonModes.trades')}
                </Button>
              </Box>
            </Box>

            {/* Horizon Horizon Selection Options */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {horizonMode === 'time'
                ? TIME_HORIZONS.map((thKey) => {
                    const approxCount = getApproxTradesForTimeHorizon(monthlyTradesRate, thKey);
                    const isSelected = timeHorizon === thKey;
                    return (
                      <Button
                        key={thKey}
                        onClick={() => handleTimeHorizonSelect(thKey)}
                        variant="outlined"
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 1.5,
                          py: 0.5,
                          minWidth: 72,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          lineHeight: 1.1,
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: isSelected
                            ? isDark
                              ? alpha(theme.palette.primary.main, 0.2)
                              : alpha(theme.palette.primary.main, 0.1)
                            : 'background.paper',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          color: isSelected ? 'primary.main' : 'text.primary',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: isSelected
                              ? alpha(theme.palette.primary.main, 0.25)
                              : alpha(theme.palette.primary.main, 0.06),
                          },
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: isSelected ? 'primary.main' : 'text.primary',
                          }}
                        >
                          {t(`forecast.timeHorizons.${thKey}`)}
                        </Typography>
                        {isSelected && isLoading ? (
                          <Box
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}
                          >
                            <CircularProgress
                              size={10}
                              thickness={5}
                              sx={{ color: 'primary.main' }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: 'primary.main',
                              }}
                            >
                              {t('forecast.timeHorizons.approxTrades', { count: approxCount })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: isSelected ? 'primary.main' : 'text.secondary',
                              opacity: isSelected ? 0.95 : 0.75,
                              mt: 0.2,
                            }}
                          >
                            {t('forecast.timeHorizons.approxTrades', { count: approxCount })}
                          </Typography>
                        )}
                      </Button>
                    );
                  })
                : TRADES_HORIZONS.map((count) => {
                    const isSelected = tradesHorizon === count;
                    return (
                      <Button
                        key={count}
                        onClick={() => handleTradesHorizonSelect(count)}
                        variant="outlined"
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          px: 1.5,
                          py: 0.5,
                          minWidth: 68,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          lineHeight: 1.1,
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: isSelected
                            ? isDark
                              ? alpha(theme.palette.primary.main, 0.2)
                              : alpha(theme.palette.primary.main, 0.1)
                            : 'background.paper',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          color: isSelected ? 'primary.main' : 'text.primary',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: isSelected
                              ? alpha(theme.palette.primary.main, 0.25)
                              : alpha(theme.palette.primary.main, 0.06),
                          },
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: isSelected ? 'primary.main' : 'text.primary',
                          }}
                        >
                          +{count}
                        </Typography>
                        {isSelected && isLoading ? (
                          <Box
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}
                          >
                            <CircularProgress
                              size={10}
                              thickness={5}
                              sx={{ color: 'primary.main' }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: 'primary.main',
                              }}
                            >
                              {t('forecast.horizonModes.trades').toLowerCase()}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: isSelected ? 'primary.main' : 'text.secondary',
                              opacity: isSelected ? 0.95 : 0.75,
                              mt: 0.2,
                            }}
                          >
                            {t('forecast.horizonModes.trades').toLowerCase()}
                          </Typography>
                        )}
                      </Button>
                    );
                  })}
            </Box>
          </Box>

          {!hasSufficientData ? (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              {t('forecast.insufficientData')}
            </Alert>
          ) : !hasSelectedOption ? (
            <Box
              sx={{
                py: { xs: 4, sm: 5 },
                px: 2,
                borderRadius: 2,
                border: (th) => `1px dashed ${th.palette.divider}`,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.015)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AutoGraphIcon sx={{ fontSize: 32 }} />
              </Box>
              <div>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {t('forecast.placeholder.title')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 460, mx: 'auto', fontSize: '0.85rem' }}
                >
                  {t('forecast.placeholder.subtitle')}
                </Typography>
              </div>
            </Box>
          ) : !forecast ? (
            <ForecastSkeleton />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                opacity: isLoading ? 0.65 : 1,
                transition: 'opacity 0.2s ease-in-out',
                pointerEvents: isLoading ? 'none' : 'auto',
              }}
              aria-busy={isLoading}
            >
              {/* Three-Mode KPI Cards: Conservative, Average, Optimistic */}
              <ForecastKpiCards
                forecast={forecast}
                currency={currency}
                numberFormat={numberFormat}
                selectedScenario={selectedScenario}
                onSelectScenario={handleScenarioSelect}
              />

              {/* Visualization Fan Chart */}
              <ForecastChart
                points={forecast.chartPoints}
                currentDeposit={forecast.currentDeposit}
                currency={currency}
                numberFormat={numberFormat}
                selectedScenario={selectedScenario}
              />
            </Box>
          )}

          {/* Technique Description: Strictly under 15 words */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: 1.25,
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}
            >
              <Box component="span" sx={{ fontWeight: 800, color: 'primary.main', mr: 0.75 }}>
                {t(`forecast.models.${model}`)}:
              </Box>
              {t(forecast?.techniqueDescriptionKey ?? `forecast.techniques.${model}`)}
            </Typography>
          </Box>

          {/* Standard Regulatory / Financial Disclaimer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              px: 2,
              py: 1,
              borderRadius: 1.5,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              border: (th) => `1px dashed ${th.palette.divider}`,
            }}
          >
            <WarningAmberIcon
              sx={{ fontSize: 17, color: 'text.secondary', mt: 0.2, flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.75rem', lineHeight: 1.4, fontWeight: 500 }}
            >
              {t('forecast.disclaimer')}
            </Typography>
          </Box>
        </Paper>
      </section>
    );
  }
);

ForecastSection.displayName = 'ForecastSection';
