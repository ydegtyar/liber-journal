import React from 'react';
import { Tooltip, useTheme } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import { InstrumentRating } from '../../utils/instrumentScore';
import { getRatingBadgeStyle } from './InstrumentRatingBadge.styles';

export interface Props {
  rating: InstrumentRating;
}

export const InstrumentRatingBadge: React.FC<Props> = React.memo(({ rating }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  if (rating === 'best') {
    const tooltipText = t('instruments.best', { defaultValue: 'Best' });
    return (
      <Tooltip title={tooltipText} arrow enterTouchDelay={0}>
        <span
          style={getRatingBadgeStyle(theme.palette.success.main)}
          tabIndex={0}
          role="img"
          aria-label={tooltipText}
        >
          <StarIcon sx={{ fontSize: 16 }} />
        </span>
      </Tooltip>
    );
  }

  if (rating === 'worst') {
    const tooltipText = t('instruments.worst', { defaultValue: 'Worst' });
    return (
      <Tooltip title={tooltipText} arrow enterTouchDelay={0}>
        <span
          style={getRatingBadgeStyle(theme.palette.error.main)}
          tabIndex={0}
          role="img"
          aria-label={tooltipText}
        >
          <ThumbDownIcon sx={{ fontSize: 14 }} />
        </span>
      </Tooltip>
    );
  }

  if (rating === 'insufficient') {
    const tooltipText = t('instruments.lowSample', { defaultValue: 'Low sample' });
    return (
      <Tooltip title={tooltipText} arrow enterTouchDelay={0}>
        <span
          style={getRatingBadgeStyle(theme.palette.text.secondary)}
          tabIndex={0}
          role="img"
          aria-label={tooltipText}
        >
          <InfoOutlinedIcon sx={{ fontSize: 15 }} />
        </span>
      </Tooltip>
    );
  }

  return null;
});

InstrumentRatingBadge.displayName = 'InstrumentRatingBadge';
