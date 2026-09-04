import React, { useState, useEffect } from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';
import { NumberFormatOption } from '../../types/preferences';
import { TradeRowActions } from './TradeRowActions';
import {
  formatCurrency,
  formatPrice,
  formatSignedPnl,
  formatDate,
} from '../../lib/formatters';

interface TradeRowProps {
  trade: Trade;
  currency: string;
  numberFormat: NumberFormatOption;
  locale?: string;
  onUpdate: (updatedTrade: Trade) => void;
  onDuplicate: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export const TradeRow: React.FC<TradeRowProps> = ({
  trade,
  currency,
  numberFormat,
  locale = 'en-US',
  onUpdate,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(Boolean(trade.isDraft));
  const [editState, setEditState] = useState<Trade>({ ...trade });

  useEffect(() => {
    setEditState({ ...trade });
  }, [trade]);

  const handleStartEdit = () => {
    setEditState({ ...trade });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (trade.isDraft) {
      onDelete(trade.id);
    } else {
      setEditState({ ...trade });
      setIsEditing(false);
    }
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

  const handleSaveEdit = () => {
    onUpdate({
      ...editState,
      isDraft: false,
    });
    setIsEditing(false);
  };

  const pnlData = formatSignedPnl(trade.pnl, currency, numberFormat, locale);

  return (
    <TableRow
      hover
      sx={{
        backgroundColor: (theme) => {
          if (trade.isDraft) return theme.palette.action.selected;
          if (pnlData.isNegative) return theme.palette.trade.lossBg;
          if (pnlData.isPositive) return theme.palette.trade.gainBg;
          return 'inherit';
        },
        borderLeft: (theme) => {
          if (pnlData.isNegative) return `3px solid ${theme.palette.trade.loss}`;
          if (pnlData.isPositive) return `3px solid ${theme.palette.trade.gain}`;
          return `3px solid ${theme.palette.trade.breakeven}`;
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
          onDuplicate={onDuplicate}
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
          {trade.isDraft && (
            <Chip
              label={t('table.draft')}
              size="small"
              color="warning"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
            />
          )}
        </Box>
      </TableCell>

      {/* Instrument */}
      <TableCell sx={{ fontWeight: 600 }}>
        {isEditing ? (
          <TextField
            size="small"
            value={editState.instrument}
            onChange={(e) => setEditState({ ...editState, instrument: e.target.value })}
            sx={{ width: 110, '& input': { p: 0.5, fontSize: '0.8rem' } }}
          />
        ) : (
          trade.instrument
        )}
      </TableCell>

      {/* Direction */}
      <TableCell>
        <Chip
          label={trade.direction === 'buy' ? t('table.buy') : t('table.sell')}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.7rem',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: (theme) =>
              trade.direction === 'buy' ? theme.palette.trade.gainBg : theme.palette.trade.lossBg,
            color: (theme) =>
              trade.direction === 'buy' ? theme.palette.trade.gain : theme.palette.trade.loss,
            border: (theme) =>
              `1px solid ${trade.direction === 'buy' ? theme.palette.trade.gainBorder : theme.palette.trade.lossBorder}`,
          }}
        />
      </TableCell>

      {/* Opened At */}
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
        {formatDate(trade.openedAt, locale)}
      </TableCell>

      {/* Closed At */}
      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
        {formatDate(trade.closedAt, locale)}
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
