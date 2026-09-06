import React from 'react';
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { MatrixColumnBlockId, NumberFormatOption } from '../../types/preferences';
import { Trade } from '../../types/trade';
import { formatCurrency } from '../../lib/formatters';

export interface DayRowData {
  dateKey: string;
  displayDate: string;
  trades: Trade[];
  orderCount: number;
  dailyPnl: number;
}

export interface Props {
  blockId: MatrixColumnBlockId;
  dayRows: DayRowData[];
  orderColumnsCount: number;
  totalOrders: number;
  totalPnl: number;
  columnSums: number[];
  currency: string;
  numberFormat: NumberFormatOption;
  t: (key: string, options?: any) => string;
}

export const ColumnDragPreview: React.FC<Props> = React.memo(
  ({
    blockId,
    dayRows,
    orderColumnsCount,
    totalOrders,
    totalPnl,
    columnSums,
    currency,
    numberFormat,
    t,
  }) => {
    return (
      <Paper
        elevation={8}
        sx={{
          cursor: 'grabbing',
          borderRadius: 0,
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          backgroundColor: (theme) => theme.palette.background.paper,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 14px 28px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 14px 28px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          pointerEvents: 'none',
          display: 'inline-block',
        }}
      >
        <Table
          size="small"
          sx={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 'auto' }}
        >
          <TableHead>
            {blockId === 'date' && (
              <TableRow>
                <TableCell
                  sx={{
                    width: 120,
                    minWidth: 100,
                    height: 70,
                    boxSizing: 'border-box',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    p: 1,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                    }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <span>{t('dailyMatrix.date')}</span>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {blockId === 'ordersCount' && (
              <TableRow>
                <TableCell
                  sx={{
                    width: 105,
                    minWidth: 95,
                    height: 70,
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    p: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                    }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <span>{t('dailyMatrix.closedOrders')}</span>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {blockId === 'dailyPnl' && (
              <TableRow>
                <TableCell
                  sx={{
                    width: 125,
                    minWidth: 115,
                    height: 70,
                    boxSizing: 'border-box',
                    textAlign: 'right',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    backgroundColor: (theme) => theme.palette.background.paper,
                    borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    p: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 0.5,
                    }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <span>{t('dailyMatrix.dailyPnl')}</span>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {blockId === 'orders' && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={orderColumnsCount}
                    sx={{
                      height: 38,
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      backgroundColor: (theme) => theme.palette.background.paper,
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      p: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                      }}
                    >
                      <DragIndicatorIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <span>
                        {t('dailyMatrix.orders')} (1 - {orderColumnsCount})
                      </span>
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {Array.from({ length: orderColumnsCount }, (_, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        width: 75,
                        minWidth: 70,
                        height: 32,
                        boxSizing: 'border-box',
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backgroundColor: (theme) => theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        p: 0.75,
                      }}
                    >
                      {i + 1}
                    </TableCell>
                  ))}
                </TableRow>
              </>
            )}
          </TableHead>

          <TableBody>
            {dayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={blockId === 'orders' ? orderColumnsCount : 1}
                  align="center"
                  sx={{ py: 3, px: 2 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {t('dailyMatrix.noTrades')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dayRows.map((row) => (
                <TableRow key={row.dateKey}>
                  {blockId === 'date' && (
                    <TableCell
                      sx={{
                        width: 120,
                        minWidth: 100,
                        height: 38,
                        boxSizing: 'border-box',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        backgroundColor: (theme) => theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        p: 0.75,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.displayDate}
                    </TableCell>
                  )}

                  {blockId === 'ordersCount' && (
                    <TableCell
                      sx={{
                        width: 105,
                        minWidth: 95,
                        height: 38,
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.8rem',
                        color: 'text.secondary',
                        backgroundColor: (theme) => theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        p: 0.75,
                      }}
                    >
                      {row.orderCount}
                    </TableCell>
                  )}

                  {blockId === 'dailyPnl' && (
                    <TableCell
                      sx={{
                        width: 125,
                        minWidth: 115,
                        height: 38,
                        boxSizing: 'border-box',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.85rem',
                        backgroundColor: (theme) => theme.palette.background.paper,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        p: 0.75,
                        whiteSpace: 'nowrap',
                        color: (theme) =>
                          row.dailyPnl > 0
                            ? theme.palette.trade.gain
                            : row.dailyPnl < 0
                              ? theme.palette.trade.loss
                              : theme.palette.trade.breakeven,
                      }}
                    >
                      {formatCurrency(row.dailyPnl, currency, numberFormat)}
                    </TableCell>
                  )}

                  {blockId === 'orders' &&
                    Array.from({ length: orderColumnsCount }, (_, cIdx) => {
                      const trade = row.trades[cIdx];
                      if (!trade) {
                        return (
                          <TableCell
                            key={cIdx}
                            sx={{
                              width: 75,
                              minWidth: 70,
                              height: 38,
                              boxSizing: 'border-box',
                              textAlign: 'right',
                              p: 0.75,
                              color: 'text.disabled',
                              fontSize: '0.75rem',
                              backgroundColor: (theme) => theme.palette.background.paper,
                              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            —
                          </TableCell>
                        );
                      }

                      const isGain = trade.pnl > 0;
                      const isLoss = trade.pnl < 0;

                      return (
                        <TableCell
                          key={cIdx}
                          sx={{
                            width: 75,
                            minWidth: 70,
                            height: 38,
                            boxSizing: 'border-box',
                            textAlign: 'right',
                            p: 0.75,
                            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            backgroundColor: (theme) =>
                              isGain
                                ? theme.palette.trade.gainBg
                                : isLoss
                                  ? theme.palette.trade.lossBg
                                  : theme.palette.background.paper,
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '0.78rem',
                              fontWeight: Math.abs(trade.pnl) >= 5 ? 700 : 500,
                              color: (theme) =>
                                isGain
                                  ? theme.palette.trade.gain
                                  : isLoss
                                    ? theme.palette.trade.loss
                                    : theme.palette.trade.breakeven,
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {trade.pnl > 0 ? `+${trade.pnl.toFixed(2)}` : trade.pnl.toFixed(2)}
                          </Typography>
                        </TableCell>
                      );
                    })}
                </TableRow>
              ))
            )}

            {/* Totals Row */}
            {dayRows.length > 0 && (
              <TableRow
                sx={{
                  backgroundColor: (theme) => theme.palette.action.hover,
                  borderTop: (theme) => `2px solid ${theme.palette.divider}`,
                }}
              >
                {blockId === 'date' && (
                  <TableCell
                    sx={{
                      width: 120,
                      minWidth: 100,
                      height: 38,
                      boxSizing: 'border-box',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      backgroundColor: (theme) => theme.palette.action.hover,
                      borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      p: 0.75,
                      textAlign: 'center',
                    }}
                  >
                    {t('dailyMatrix.total')}
                  </TableCell>
                )}

                {blockId === 'ordersCount' && (
                  <TableCell
                    sx={{
                      width: 105,
                      minWidth: 95,
                      height: 38,
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.8rem',
                      backgroundColor: (theme) => theme.palette.action.hover,
                      borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      p: 0.75,
                    }}
                  >
                    {totalOrders}
                  </TableCell>
                )}

                {blockId === 'dailyPnl' && (
                  <TableCell
                    sx={{
                      width: 125,
                      minWidth: 115,
                      height: 38,
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.9rem',
                      backgroundColor: (theme) => theme.palette.action.hover,
                      borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                      p: 0.75,
                      whiteSpace: 'nowrap',
                      color: (theme) =>
                        totalPnl > 0
                          ? theme.palette.trade.gain
                          : totalPnl < 0
                            ? theme.palette.trade.loss
                            : theme.palette.trade.breakeven,
                    }}
                  >
                    {formatCurrency(totalPnl, currency, numberFormat)}
                  </TableCell>
                )}

                {blockId === 'orders' &&
                  columnSums.map((cSum, idx) => (
                    <TableCell
                      key={idx}
                      sx={{
                        width: 75,
                        minWidth: 70,
                        height: 38,
                        boxSizing: 'border-box',
                        textAlign: 'right',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        backgroundColor: (theme) => theme.palette.action.hover,
                        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        p: 0.75,
                        whiteSpace: 'nowrap',
                        color: (theme) =>
                          cSum > 0
                            ? theme.palette.trade.gain
                            : cSum < 0
                              ? theme.palette.trade.loss
                              : 'text.secondary',
                      }}
                    >
                      {cSum !== 0 ? (cSum > 0 ? `+${cSum.toFixed(2)}` : cSum.toFixed(2)) : '—'}
                    </TableCell>
                  ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    );
  }
);

ColumnDragPreview.displayName = 'ColumnDragPreview';
