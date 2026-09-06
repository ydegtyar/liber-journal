import React, { useRef, useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useTranslation } from 'react-i18next';

interface Props {
  onFileSelected: (file: File) => Promise<unknown>;
  isImporting: boolean;
  compact?: boolean;
}

export const CsvUploadDropzone: React.FC<Props> = React.memo(
  ({ onFileSelected, isImporting, compact = false }) => {
    const { t } = useTranslation();
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await onFileSelected(e.dataTransfer.files[0]);
        }
      },
      [onFileSelected]
    );

    const handleFileChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          await onFileSelected(e.target.files[0]);
          e.target.value = '';
        }
      },
      [onFileSelected]
    );

    const handleInputTrigger = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    if (compact) {
      return (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={
              isImporting ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />
            }
            onClick={handleInputTrigger}
            disabled={isImporting}
          >
            {t('common.uploadCsv')}
          </Button>
        </>
      );
    }

    return (
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: (theme) =>
            `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: (theme) =>
            isDragOver ? theme.palette.action.hover : theme.palette.background.paper,
          cursor: 'pointer',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
        onClick={handleInputTrigger}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.tsv,.txt"
          style={{ display: 'none' }}
        />
        {isImporting ? (
          <CircularProgress size={36} sx={{ mb: 1.5 }} />
        ) : (
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        )}
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
          {t('common.dragDrop')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: '0.8rem', maxWidth: 460, mx: 'auto' }}
        >
          {t('common.supportedBrokers')}
        </Typography>
      </Box>
    );
  }
);

CsvUploadDropzone.displayName = 'CsvUploadDropzone';
