import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { Trade } from '../../types/trade';

interface TradeRowActionsProps {
  trade: Trade;
  isEditing: boolean;
  onDuplicate: (trade: Trade) => void;
  onStartEdit: (trade: Trade) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

export const TradeRowActions: React.FC<TradeRowActionsProps> = ({
  trade,
  isEditing,
  onDuplicate,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (isEditing) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title={t('common.save')}>
          <IconButton size="small" color="primary" onClick={onSaveEdit} sx={{ p: 0.5 }}>
            <CheckIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.cancel')}>
          <IconButton size="small" onClick={onCancelEdit} sx={{ p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title={t('common.duplicate')}>
        <IconButton size="small" onClick={() => onDuplicate(trade)} sx={{ p: 0.5 }}>
          <ContentCopyIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('common.edit')}>
        <IconButton size="small" onClick={() => onStartEdit(trade)} sx={{ p: 0.5 }}>
          <EditIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('common.delete')}>
        <IconButton size="small" color="error" onClick={() => onDelete(trade.id)} sx={{ p: 0.5 }}>
          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
