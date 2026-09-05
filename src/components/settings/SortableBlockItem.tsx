import React from 'react';
import { Paper, Typography, alpha } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { PageBlockId } from '../../types/preferences';
import { BlockCard } from './BlockCard';

export interface SortableBlockItemProps {
  id: PageBlockId;
  isVisible: boolean;
  onToggleVisibility: (id: PageBlockId) => void;
  index: number;
}

export const SortableBlockItem: React.FC<SortableBlockItemProps> = React.memo(
  ({ id, isVisible, onToggleVisibility, index }) => {
    const { t } = useTranslation();

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
    });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    if (isDragging) {
      return (
        <Paper
          ref={setNodeRef}
          style={style}
          variant="outlined"
          sx={{
            p: 1.25,
            borderRadius: 1.5,
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.25,
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.07),
            color: 'primary.main',
            transition: 'all 0.15s ease',
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 18, opacity: 0.8 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              opacity: 0.9,
              userSelect: 'none',
            }}
          >
            {t('layoutSettings.dropSlot')}
          </Typography>
        </Paper>
      );
    }

    return (
      <div ref={setNodeRef} style={style}>
        <BlockCard
          id={id}
          index={index}
          isVisible={isVisible}
          onToggleVisibility={onToggleVisibility}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  }
);

SortableBlockItem.displayName = 'SortableBlockItem';
