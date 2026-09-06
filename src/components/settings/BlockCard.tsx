import React from 'react';
import { Paper, Box, Typography, Tooltip, Chip, Switch, alpha } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import { useTranslation } from 'react-i18next';
import { PageBlockId } from '../../types/preferences';
import { BLOCK_CONFIGS } from './blockConfigs';

export interface Props {
  id: PageBlockId;
  index: number;
  isVisible: boolean;
  onToggleVisibility?: (id: PageBlockId) => void;
  isOverlay?: boolean;
  dragHandleProps?: Record<string, any>;
}

export const BlockCard: React.FC<Props> = React.memo(
  ({ id, index, isVisible, onToggleVisibility, isOverlay = false, dragHandleProps }) => {
    const { t } = useTranslation();
    const config = BLOCK_CONFIGS[id] ?? {
      id,
      nameKey: id,
      descKey: '',
      icon: <ViewQuiltIcon sx={{ fontSize: 20 }} />,
    };

    const blockName = t(config.nameKey);
    const blockDesc = t(config.descKey);

    return (
      <Paper
        elevation={isOverlay ? 8 : 0}
        variant="outlined"
        sx={{
          p: 1.25,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          backgroundColor: isOverlay
            ? 'background.paper'
            : isVisible
              ? 'background.paper'
              : 'action.hover',
          borderColor: isOverlay ? 'primary.main' : isVisible ? 'divider' : 'transparent',
          borderWidth: isOverlay ? 2 : 1,
          cursor: isOverlay ? 'grabbing' : 'default',
          boxShadow: isOverlay
            ? (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                  : '0 14px 28px -4px rgba(0, 0, 0, 0.18), 0 6px 12px -2px rgba(0, 0, 0, 0.08)'
            : 'none',
          transform: isOverlay ? 'scale(1.02)' : 'none',
          transition: isOverlay
            ? 'none'
            : 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          '&:hover': isOverlay
            ? {}
            : {
                borderColor: isVisible ? 'primary.light' : 'divider',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
              },
        }}
      >
        {/* Drag Handle */}
        {isOverlay ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              cursor: 'grabbing',
              p: 0.5,
              borderRadius: 1,
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        ) : (
          <Tooltip title={t('layoutSettings.dragHandleAria', { name: blockName })}>
            <Box
              {...dragHandleProps}
              aria-label={t('layoutSettings.dragHandleAria', { name: blockName })}
              role="button"
              tabIndex={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                cursor: 'grab',
                touchAction: 'none',
                p: 0.5,
                borderRadius: 1,
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: 'action.hover',
                },
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          </Tooltip>
        )}

        {/* Numerical Index Badge */}
        <Typography
          variant="caption"
          sx={{
            color: isOverlay ? 'primary.main' : 'text.disabled',
            fontWeight: 700,
            minWidth: 16,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {index + 1}
        </Typography>

        {/* Semantic Block Content Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: isOverlay
              ? (theme) => alpha(theme.palette.primary.main, 0.15)
              : isVisible
                ? 'action.selected'
                : 'action.disabledBackground',
            color: isOverlay || isVisible ? 'primary.main' : 'text.disabled',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </Box>

        {/* Block Information (Named based on content) */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: isVisible ? 'text.primary' : 'text.secondary',
              }}
            >
              {blockName}
            </Typography>
            {!isVisible && (
              <Chip
                label={t('layoutSettings.hiddenBadge')}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'text.disabled',
                  borderColor: 'divider',
                }}
              />
            )}
          </Box>
          {blockDesc && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.72rem',
                lineHeight: 1.2,
                mt: 0.2,
              }}
            >
              {blockDesc}
            </Typography>
          )}
        </Box>

        {/* Visibility Toggle Switch */}
        {isOverlay ? (
          <Switch
            size="small"
            checked={isVisible}
            disabled
            sx={{
              opacity: 0.7,
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'primary.main',
              },
            }}
          />
        ) : (
          <Tooltip title={t('layoutSettings.visibilityToggleAria', { name: blockName })}>
            <Switch
              size="small"
              checked={isVisible}
              onChange={() => onToggleVisibility?.(id)}
              inputProps={{
                'aria-label': t('layoutSettings.visibilityToggleAria', { name: blockName }),
              }}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          </Tooltip>
        )}
      </Paper>
    );
  }
);

BlockCard.displayName = 'BlockCard';
