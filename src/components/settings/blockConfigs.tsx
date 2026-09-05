import React from 'react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import InsightsIcon from '@mui/icons-material/Insights';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableChartIcon from '@mui/icons-material/TableChart';
import { PageBlockId } from '../../types/preferences';

export interface BlockConfig {
  id: PageBlockId;
  nameKey: string;
  descKey: string;
  icon: React.ReactElement;
}

export const BLOCK_CONFIGS: Record<PageBlockId, BlockConfig> = {
  timeframeBanner: {
    id: 'timeframeBanner',
    nameKey: 'layoutSettings.blocks.timeframeBanner.name',
    descKey: 'layoutSettings.blocks.timeframeBanner.description',
    icon: <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />,
  },
  statsGrid: {
    id: 'statsGrid',
    nameKey: 'layoutSettings.blocks.statsGrid.name',
    descKey: 'layoutSettings.blocks.statsGrid.description',
    icon: <QueryStatsIcon sx={{ fontSize: 20 }} />,
  },
  periodInsights: {
    id: 'periodInsights',
    nameKey: 'layoutSettings.blocks.periodInsights.name',
    descKey: 'layoutSettings.blocks.periodInsights.description',
    icon: <InsightsIcon sx={{ fontSize: 20 }} />,
  },
  visualizations: {
    id: 'visualizations',
    nameKey: 'layoutSettings.blocks.visualizations.name',
    descKey: 'layoutSettings.blocks.visualizations.description',
    icon: <ShowChartIcon sx={{ fontSize: 20 }} />,
  },
  streakAnalysis: {
    id: 'streakAnalysis',
    nameKey: 'layoutSettings.blocks.streakAnalysis.name',
    descKey: 'layoutSettings.blocks.streakAnalysis.description',
    icon: <ElectricBoltIcon sx={{ fontSize: 20 }} />,
  },
  instrumentsTable: {
    id: 'instrumentsTable',
    nameKey: 'layoutSettings.blocks.instrumentsTable.name',
    descKey: 'layoutSettings.blocks.instrumentsTable.description',
    icon: <PieChartOutlineIcon sx={{ fontSize: 20 }} />,
  },
  monthlyReturns: {
    id: 'monthlyReturns',
    nameKey: 'layoutSettings.blocks.monthlyReturns.name',
    descKey: 'layoutSettings.blocks.monthlyReturns.description',
    icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />,
  },
  tradesView: {
    id: 'tradesView',
    nameKey: 'layoutSettings.blocks.tradesView.name',
    descKey: 'layoutSettings.blocks.tradesView.description',
    icon: <TableChartIcon sx={{ fontSize: 20 }} />,
  },
};
