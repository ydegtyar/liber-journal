import React, { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Chip,
  Box,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import { Trade, Direction } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { TradeRowActions } from './TradeRowActions';
import {
  formatCurrency,
  formatPrice,
  formatSignedPnl,
  formatDate,
  formatDuration,
  formatDetailedDuration,
} from '../../lib/formatters';

interface TradeRowProps {
  trade: Trade;
  currency: string;
  numberFormat: NumberFormatOption;
  locale?: string;
  onUpdate: (updatedTrade: Trade) => void;
  onDelete: (id: string) => void;
}

export const TradeRow: React.FC<TradeRowProps> = ({
  trade,
  currency,
  numberFormat,
  locale = 'en-US',
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<Trade>({ ...trade });

  useEffect(() => {
    setEditState({ ...trade });
  }, [trade]);

  const handleStartEdit = () => {
    setEditState({ ...trade });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditState({ ...trade });
    setIsEditing(false);
  };

  const handlePriceOrMarginChange = (field: 'openPrice' | 'closePrice' | 'margin' | 'leverage', value: number) => {
    const nextState = { ...editState, [field]: value };
    // Automatically recalculate gross return and PnL if prices changed
    if (nextState.openPrice > 0 && nextState.closePrice > 0 && nextState.margin > 0) {
      const priceDiff =
        nextState.direction === 'buy'
          ? (nextState.closePrice - nextState.openPrice) / nextState.openPrice
          : (nextState.openPrice - nextState.closePrice) / nextState.openPrice;
      const computedPnl = Math.round((nextState.margin * nextState.leverage * priceDiff) * 100) / 100;
      nextState.pnl = computedPnl;
      nextState.grossReturn = Math.round((nextState.margin + computedPnl) * 100) / 100;
    }
    setEditState(nextState);
  };

  const handleToggleDirection = () => {
    const nextDirection: Direction = editState.direction === 'buy' ? 'sell' : 'buy';
    const nextState = { ...editState, direction: nextDirection };
    if (nextState.openPrice > 0 && nextState.closePrice > 0 && nextState.margin > 0) {
      const priceDiff =
        nextState.direction === 'buy'
          ? (nextState.closePrice - nextState.openPrice) / nextState.openPrice
          : (nextState.openPrice - nextState.closePrice) / nextState.openPrice;
      const computedPnl = Math.round((nextState.margin * nextState.leverage * priceDiff) * 100) / 100;
      nextState.pnl = computedPnl;
      nextState.grossReturn = Math.round((nextState.margin + computedPnl) * 100) / 100;
    }
    setEditState(nextState);
  };

  const handleSaveEdit = () => {
    onUpdate(editState);
    setIsEditing(false);
  };

  const pnlData = formatSignedPnl(trade.pnl, currency, numberFormat, locale);

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
      {/* Actions */}
      <TableCell sx={{ width: 90, px: 1 }}>
        <TradeRowActions
          trade={trade}
          isEditing={isEditing}
          onStartEdit={handleStartEdit}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
          onDelete={onDelete}
        />
      </TableCell>

      {/* Deal ID */}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
            {trade.dealId || trade.id.substring(0, 10)}
          </Typography>
        </Box>
      </TableCell>

      {/* Instrument with colored direction arrow */}
      <TableCell sx={{ fontWeight: 600 }}>
        {isEditing ? (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip
              title={`${editState.direction === 'buy' ? t('table.buy') : t('table.sell')} (${t('table.clickToToggle', { defaultValue: 'Click to toggle direction' })})`}
              arrow
            >
              <IconButton
                size="small"
                onClick={handleToggleDirection}
                sx={{
                  p: 0.25,
                  color: (theme) =>
                    editState.direction === 'buy' ? theme.palette.trade.gain : theme.palette.trade.loss,
                }}
              >
                {editState.direction === 'buy' ? (
                  <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
            <TextField
              size="small"
              value={editState.instrument}
              onChange={(e) => setEditState({ ...editState, instrument: e.target.value })}
              sx={{ width: 100, '& input': { p: 0.5, fontSize: '0.8rem' } }}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Tooltip title={trade.direction === 'buy' ? t('table.buy') : t('table.sell')} arrow>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: (theme) =>
                    trade.direction === 'buy' ? theme.palette.trade.gain : theme.palette.trade.loss,
                }}
              >
                {trade.direction === 'buy' ? (
                  <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                )}
              </Box>
            </Tooltip>
            <span>{trade.instrument}</span>
          </Box>
        )}
      </TableCell>

      {/* Duration with Tooltip */}
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
              <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(128, 128, 128, 0.3)' }}>
                <strong>{t('table.duration')}:</strong> {formatDetailedDuration(trade.openedAt, trade.closedAt)}
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
            {formatDuration(trade.openedAt, trade.closedAt)}
          </Box>
        </Tooltip>
      </TableCell>

      {/* Open Price */}
      <TableCell sx={{ textAlign: 'right' }}>
        {isEditing ? (
          <TextField
            type="number"
            size="small"
            value={editState.openPrice}
            onChange={(e) => handlePriceOrMarginChange('openPrice', parseFloat(e.target.value) || 0)}
            sx={{ width: 90, '& input': { p: 0.5, fontSize: '0.8rem', textAlign: 'right' } }}
          />
        ) : (
          formatPrice(trade.openPrice, numberFormat, locale)
        )}
      </TableCell>

      {/* Close Price */}
      <TableCell sx={{ textAlign: 'right' }}>
        {isEditing ? (
          <TextField
            type="number"
            size="small"
            value={editState.closePrice}
            onChange={(e) => handlePriceOrMarginChange('closePrice', parseFloat(e.target.value) || 0)}
            sx={{ width: 90, '& input': { p: 0.5, fontSize: '0.8rem', textAlign: 'right' } }}
          />
        ) : (
          formatPrice(trade.closePrice, numberFormat, locale)
        )}
      </TableCell>

      {/* Margin */}
      <TableCell sx={{ textAlign: 'right' }}>
        {isEditing ? (
          <TextField
            type="number"
            size="small"
            value={editState.margin}
            onChange={(e) => handlePriceOrMarginChange('margin', parseFloat(e.target.value) || 0)}
            sx={{ width: 80, '& input': { p: 0.5, fontSize: '0.8rem', textAlign: 'right' } }}
          />
        ) : (
          formatCurrency(trade.margin, currency, numberFormat, locale)
        )}
      </TableCell>

      {/* Leverage */}
      <TableCell sx={{ textAlign: 'center' }}>
        {isEditing ? (
          <TextField
            type="number"
            size="small"
            value={editState.leverage}
            onChange={(e) => handlePriceOrMarginChange('leverage', parseFloat(e.target.value) || 1)}
            sx={{ width: 60, '& input': { p: 0.5, fontSize: '0.8rem', textAlign: 'center' } }}
          />
        ) : (
          `x${trade.leverage}`
        )}
      </TableCell>

      {/* Gross Return */}
      <TableCell sx={{ textAlign: 'right', color: 'text.secondary' }}>
        {formatCurrency(isEditing ? editState.grossReturn : trade.grossReturn, currency, numberFormat, locale)}
      </TableCell>

      {/* Net P&L (Accessible styling: red border, tinted background, sign/icon) */}
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
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, justifyContent: 'flex-end' }}>
          {pnlData.isPositive && <TrendingUpIcon sx={{ fontSize: 16 }} />}
          {pnlData.isNegative && <TrendingDownIcon sx={{ fontSize: 16 }} />}
          {pnlData.isBreakeven && <RemoveIcon sx={{ fontSize: 14 }} />}
          <span>{isEditing ? formatSignedPnl(editState.pnl, currency, numberFormat, locale).text : pnlData.text}</span>
        </Box>
      </TableCell>

      {/* Tag */}
      <TableCell>
        {isEditing ? (
          <TextField
            size="small"
            placeholder="Setup tag"
            value={editState.tag || ''}
            onChange={(e) => setEditState({ ...editState, tag: e.target.value })}
            sx={{ width: 90, '& input': { p: 0.5, fontSize: '0.75rem' } }}
          />
        ) : trade.tag ? (
          <Chip label={trade.tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
        ) : (
          '-'
        )}
      </TableCell>

      {/* Notes */}
      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isEditing ? (
          <TextField
            size="small"
            placeholder="Notes"
            value={editState.note || ''}
            onChange={(e) => setEditState({ ...editState, note: e.target.value })}
            sx={{ width: 140, '& input': { p: 0.5, fontSize: '0.75rem' } }}
          />
        ) : (
          trade.note || '-'
        )}
      </TableCell>
    </TableRow>
  );
};
