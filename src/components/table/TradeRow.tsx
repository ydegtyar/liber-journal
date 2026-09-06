import React from 'react';
import { TableRow, TableCell, Box, Tooltip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import {
  formatCurrency,
  formatPrice,
  formatSignedPnl,
  formatDate,
  formatDuration,
  formatDetailedDuration,
} from '../../lib/formatters';

interface Props {
  trade: Trade;
  currency: string;
  numberFormat: NumberFormatOption;
  locale?: string;
}

const TradeRowComponent: React.FC<Props> = ({
  trade,
  currency,
  numberFormat,
  locale = 'en-US',
}) => {
  const { t } = useTranslation();
  const pnlData = React.useMemo(
    () => formatSignedPnl(trade.pnl, currency, numberFormat, locale),
    [trade.pnl, currency, numberFormat, locale]
  );

  return (
    <TableRow
      hover
      sx={{
        backgroundColor: (theme) => {
          if (pnlData.isNegative) return theme.palette.trade.lossBg;
          if (pnlData.isPositive) return theme.palette.trade.gainBg;
          return 'inherit';
        },
        '&:hover': {
          backgroundColor: (theme) => {
            if (pnlData.isNegative) return `${theme.palette.trade.lossBg} !important`;
            if (pnlData.isPositive) return `${theme.palette.trade.gainBg} !important`;
            return undefined;
          },
        },
      }}
    >
      {/* 1. Date */}
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
        {formatDate(trade.closedAt || trade.openedAt, locale)}
      </TableCell>

      {/* 2. Instrument with colored direction arrow */}
      <TableCell sx={{ fontWeight: 600 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap' }}>
          <Tooltip
            title={trade.direction === 'buy' ? t('table.buy') : t('table.sell')}
            arrow
            placement="top"
          >
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
              {trade.direction === 'buy' ? (
                <ArrowUpwardIcon
                  sx={{
                    fontSize: 16,
                    color: (theme) => theme.palette.trade.gain,
                  }}
                />
              ) : (
                <ArrowDownwardIcon
                  sx={{
                    fontSize: 16,
                    color: (theme) => theme.palette.trade.loss,
                  }}
                />
              )}
            </Box>
          </Tooltip>
          <span>{trade.instrument}</span>
        </Box>
      </TableCell>

      {/* 3. Duration with Tooltip */}
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
        <Tooltip
          arrow
          placement="top"
          title={
            <Box sx={{ p: 0.5, lineHeight: 1.6, fontSize: '0.75rem' }}>
              <div>
                <strong>{t('table.openedAt')}:</strong> {formatDate(trade.openedAt, locale, true)}
              </div>
              <div>
                <strong>{t('table.closedAt')}:</strong> {formatDate(trade.closedAt, locale, true)}
              </div>
              <div
                style={{
                  marginTop: 4,
                  paddingTop: 4,
                  borderTop: '1px solid rgba(128, 128, 128, 0.3)',
                }}
              >
                <strong>{t('table.duration')}:</strong>{' '}
                {formatDetailedDuration(trade.openedAt, trade.closedAt, locale)}
              </div>
            </Box>
          }
        >
          <Box
            component="span"
            sx={{
              cursor: 'help',
              borderBottom: '1px dotted',
              borderColor: 'text.secondary',
              display: 'inline-block',
            }}
          >
            {formatDuration(trade.openedAt, trade.closedAt, locale)}
          </Box>
        </Tooltip>
      </TableCell>

      {/* 4. Open Price */}
      <TableCell sx={{ textAlign: 'right' }}>
        {formatPrice(trade.openPrice, numberFormat, locale)}
      </TableCell>

      {/* 5. Close Price */}
      <TableCell sx={{ textAlign: 'right' }}>
        {formatPrice(trade.closePrice, numberFormat, locale)}
      </TableCell>

      {/* 6. Margin */}
      <TableCell sx={{ textAlign: 'right' }}>
        {formatCurrency(trade.margin, currency, numberFormat, locale)}
      </TableCell>

      {/* 7. Leverage */}
      <TableCell sx={{ textAlign: 'center' }}>{`x${trade.leverage}`}</TableCell>

      {/* 8. Gross Return */}
      <TableCell sx={{ textAlign: 'right', color: 'text.secondary' }}>
        {formatCurrency(trade.grossReturn, currency, numberFormat, locale)}
      </TableCell>

      {/* 9. Net P&L (Accessible styling: red border, tinted background, sign/icon) */}
      <TableCell
        sx={{
          textAlign: 'right',
          fontWeight: 700,
          color: (theme) => {
            if (pnlData.isPositive) return theme.palette.trade.gain;
            if (pnlData.isNegative) return theme.palette.trade.loss;
            return theme.palette.trade.breakeven;
          },
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.3,
            justifyContent: 'flex-end',
          }}
        >
          {pnlData.isPositive && <TrendingUpIcon sx={{ fontSize: 16 }} />}
          {pnlData.isNegative && <TrendingDownIcon sx={{ fontSize: 16 }} />}
          {pnlData.isBreakeven && <RemoveIcon sx={{ fontSize: 14 }} />}
          <span>{pnlData.text}</span>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export const TradeRow = React.memo(TradeRowComponent);
