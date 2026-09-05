import React from 'react';
import { TableCell, Box, SxProps, Theme } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MatrixColumnBlockId } from '../../types/preferences';

export interface SortableColumnHeaderProps {
  id: MatrixColumnBlockId;
  children: React.ReactNode;
  colSpan?: number;
  rowSpan?: number;
  align?: 'left' | 'center' | 'right';
  sx?: SxProps<Theme>;
}

export const SortableColumnHeader: React.FC<SortableColumnHeaderProps> = React.memo(
  ({ id, children, colSpan, rowSpan, align = 'center', sx }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
    });

    const style: React.CSSProperties = {
      transform: isDragging ? undefined : CSS.Translate.toString(transform),
      transition,
      zIndex: isDragging ? 15 : undefined,
    };

    return (
      <TableCell
        ref={setNodeRef}
        colSpan={colSpan}
        rowSpan={rowSpan}
        align={align}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          transition: 'background-color 0.2s',
          backgroundColor: isDragging ? (theme) => theme.palette.action.hover : undefined,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          '&:hover': {
            backgroundColor: (theme) => theme.palette.action.hover,
          },
          '&:hover .drag-handle': {
            opacity: 1,
          },
          ...sx,
        }}
      >
        <Box sx={{ visibility: isDragging ? 'hidden' : 'visible' }}>{children}</Box>
      </TableCell>
    );
  }
);

SortableColumnHeader.displayName = 'SortableColumnHeader';
