import React from 'react';
import { Box, Paper, Grid, Skeleton } from '@mui/material';

/**
 * Pixel-accurate skeleton loader for the Forecast section.
 * Mirrors the exact DOM dimensions, layout hierarchy, and responsive breakpoints
 * of ForecastKpiCards and ForecastChart to eliminate Cumulative Layout Shift (CLS).
 */
export const ForecastSkeleton: React.FC = React.memo(() => {
  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
      aria-busy="true"
      aria-label="Loading forecast projections"
    >
      {/* 3 Scenario Cards & Secondary Metrics Bar */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          {[0, 1, 2].map((idx) => (
            <Grid item xs={12} sm={4} key={idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: 144,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {/* Header: Icon + Label & Badge */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Skeleton variant="circular" width={18} height={18} />
                    <Skeleton variant="text" width={80} height={20} />
                  </Box>
                  <Skeleton variant="rounded" width={52} height={20} sx={{ borderRadius: 1 }} />
                </Box>

                {/* Projected Deposit Value */}
                <Box sx={{ my: 'auto' }}>
                  <Skeleton variant="text" width={95} height={16} />
                  <Skeleton
                    variant="rounded"
                    width="60%"
                    height={28}
                    sx={{ mt: 0.5, borderRadius: 1 }}
                  />
                </Box>

                {/* P&L and ROI Row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pt: 1,
                    borderTop: (th) => `1px dashed ${th.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={65} height={18} />
                  </Box>
                  <Skeleton variant="rounded" width={56} height={18} sx={{ borderRadius: 1 }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Secondary Metrics Bar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            px: 2,
            py: 1.25,
            minHeight: 45,
            borderRadius: 1.5,
            backgroundColor: (th) =>
              th.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: (th) => `1px solid ${th.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="text" width={90} height={20} />
            <Skeleton variant="text" width={65} height={20} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="text" width={115} height={20} />
              <Skeleton variant="rounded" width={44} height={22} sx={{ borderRadius: 3 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant="text" width={130} height={20} />
              <Skeleton variant="rounded" width={44} height={22} sx={{ borderRadius: 3 }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Fan Chart Skeleton */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Chart Legend Skeleton */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            mb: 2,
            minHeight: 24,
          }}
        >
          {[95, 125, 110, 120].map((width, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Skeleton variant="rounded" width={12} height={4} sx={{ borderRadius: 1 }} />
              <Skeleton variant="text" width={width} height={18} />
            </Box>
          ))}
        </Box>

        {/* Chart Area */}
        <Skeleton variant="rounded" width="100%" height={360} sx={{ borderRadius: 1.5 }} />
      </Paper>
    </Box>
  );
});

ForecastSkeleton.displayName = 'ForecastSkeleton';
