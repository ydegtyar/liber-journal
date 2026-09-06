import React, { useState, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';

import {
  PageBlockId,
  JournalSettings,
  NumberFormatOption,
  DEFAULT_PAGE_BLOCK_ORDER,
} from '../../types/preferences';

import { BlockCard } from './BlockCard';
import { SortableBlockItem } from './SortableBlockItem';

export interface PageLayoutSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: JournalSettings;
  onUpdateBlockOrder: (order: PageBlockId[]) => void;
  onToggleBlockVisibility: (blockId: PageBlockId) => void;
  onResetLayout: () => void;
  onShowAllBlocks: () => void;
  // General preferences
  onUpdateSettings?: (newSettings: Partial<JournalSettings>) => void;
  numberFormat?: NumberFormatOption;
  onUpdateNumberFormat?: (format: NumberFormatOption) => void;
  onClearAllData?: () => Promise<void>;
  initialTab?: 'layout' | 'preferences';
}

export const PageLayoutSettingsDrawer: React.FC<PageLayoutSettingsDrawerProps> = React.memo(
  ({
    open,
    onClose,
    settings,
    onUpdateBlockOrder,
    onToggleBlockVisibility,
    onResetLayout,
    onShowAllBlocks,
    onUpdateSettings,
    numberFormat = 'locale',
    onUpdateNumberFormat,
    onClearAllData,
    initialTab = 'layout',
  }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useLocalStorage<'layout' | 'preferences'>(
      'liber_journal_settings_tab',
      initialTab
    );
    const [confirmClear, setConfirmClear] = useState(false);
    const [activeId, setActiveId] = useState<PageBlockId | null>(null);

    // Setup sensors for dnd-kit best practices (pointer + keyboard accessibility)
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 4,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const blockOrder = settings.pageBlockOrder || DEFAULT_PAGE_BLOCK_ORDER;
    const hiddenBlocks = settings.hiddenPageBlocks || [];
    const visibleCount = blockOrder.length - hiddenBlocks.length;

    const handleDragStart = useCallback((event: DragStartEvent) => {
      setActiveId(event.active.id as PageBlockId);
    }, []);

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
          const oldIndex = blockOrder.indexOf(active.id as PageBlockId);
          const newIndex = blockOrder.indexOf(over.id as PageBlockId);
          if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(blockOrder, oldIndex, newIndex);
            onUpdateBlockOrder(newOrder);
          }
        }
      },
      [blockOrder, onUpdateBlockOrder]
    );

    const handleDragCancel = useCallback(() => {
      setActiveId(null);
    }, []);

    const handleClearTrades = useCallback(async () => {
      if (onClearAllData) {
        await onClearAllData();
        setConfirmClear(false);
        onClose();
      }
    }, [onClearAllData, onClose]);

    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100vw', sm: 400, md: 440 },
              maxWidth: '100vw',
              backgroundColor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {t('layoutSettings.title')}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label={t('common.close')}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Tabs: Page Blocks / Preferences */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="fullWidth"
            sx={{ minHeight: 40 }}
          >
            <Tab
              value="layout"
              label={t('layoutSettings.tabLayout')}
              icon={<ViewQuiltIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ minHeight: 40, py: 0.5, fontSize: '0.8rem', fontWeight: 700 }}
            />
            <Tab
              value="preferences"
              label={t('layoutSettings.tabPreferences')}
              icon={<SettingsIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ minHeight: 40, py: 0.5, fontSize: '0.8rem', fontWeight: 700 }}
            />
          </Tabs>
        </Box>

        {/* Drawer Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {activeTab === 'layout' ? (
            <Box>
              {/* Quick Action Bar / Counters */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.75,
                }}
              >
                <Chip
                  label={t('layoutSettings.blocksCount', {
                    visible: visibleCount,
                    total: blockOrder.length,
                  })}
                  size="small"
                  variant="outlined"
                  color={visibleCount > 0 ? 'default' : 'error'}
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  {hiddenBlocks.length > 0 && (
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                      onClick={onShowAllBlocks}
                      sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.2 }}
                    >
                      {t('layoutSettings.showAll')}
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="text"
                    color="secondary"
                    startIcon={<RestartAltIcon sx={{ fontSize: 16 }} />}
                    onClick={onResetLayout}
                    sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.2 }}
                  >
                    {t('layoutSettings.resetDefault')}
                  </Button>
                </Box>
              </Box>

              {/* dnd-kit Sortable List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext items={blockOrder} strategy={verticalListSortingStrategy}>
                  <Box
                    role="list"
                    aria-label="Sortable dashboard blocks"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {blockOrder.map((id, index) => (
                      <SortableBlockItem
                        key={id}
                        id={id}
                        index={index}
                        isVisible={!hiddenBlocks.includes(id)}
                        onToggleVisibility={onToggleBlockVisibility}
                      />
                    ))}
                  </Box>
                </SortableContext>
                <DragOverlay
                  dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                  }}
                >
                  {activeId ? (
                    <BlockCard
                      id={activeId}
                      index={blockOrder.indexOf(activeId)}
                      isVisible={!hiddenBlocks.includes(activeId)}
                      isOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </Box>
          ) : (
            /* General Preferences Tab */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {/* Base Currency */}
              {onUpdateSettings && (
                <FormControl fullWidth size="small">
                  <InputLabel id="currency-select-label-sidebar">
                    {t('settingsModal.baseCurrency')}
                  </InputLabel>
                  <Select
                    labelId="currency-select-label-sidebar"
                    value={settings.currency || 'USD'}
                    label={t('settingsModal.baseCurrency')}
                    onChange={(e) => onUpdateSettings({ currency: e.target.value })}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="PLN">PLN (zł)</MenuItem>
                    <MenuItem value="UAH">UAH (₴)</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Number Formatting */}
              {onUpdateNumberFormat && (
                <FormControl fullWidth size="small">
                  <InputLabel id="number-format-label-sidebar">
                    {t('settingsModal.numberFormat')}
                  </InputLabel>
                  <Select
                    labelId="number-format-label-sidebar"
                    value={numberFormat}
                    label={t('settingsModal.numberFormat')}
                    onChange={(e) => onUpdateNumberFormat(e.target.value as NumberFormatOption)}
                  >
                    <MenuItem value="locale">{t('settingsModal.formatLocale')}</MenuItem>
                    <MenuItem value="dot">{t('settingsModal.formatDot')}</MenuItem>
                    <MenuItem value="comma">{t('settingsModal.formatComma')}</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ my: 1 }} />

              {/* Danger Zone */}
              {onClearAllData && (
                <div>
                  <Typography
                    variant="subtitle2"
                    color="error.main"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    {t('settingsModal.dangerZone')}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, fontSize: '0.8rem' }}
                  >
                    {t('settingsModal.resetDescription')}
                  </Typography>

                  {!confirmClear ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => setConfirmClear(true)}
                    >
                      {t('common.clearAllData')}
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={handleClearTrades}
                      >
                        {t('common.delete')}
                      </Button>
                      <Button variant="text" size="small" onClick={() => setConfirmClear(false)}>
                        {t('common.cancel')}
                      </Button>
                    </Box>
                  )}
                </div>
              )}
            </Box>
          )}
        </Box>

        {/* Drawer Footer */}
        <Box
          sx={{
            p: 1.5,
            px: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="contained" size="small" onClick={onClose}>
            {t('common.close')}
          </Button>
        </Box>
      </Drawer>
    );
  }
);

PageLayoutSettingsDrawer.displayName = 'PageLayoutSettingsDrawer';
