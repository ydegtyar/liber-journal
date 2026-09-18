import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Chip, alpha } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import FilePresentOutlinedIcon from '@mui/icons-material/FilePresentOutlined';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_EXTENSIONS, isSupportedFile, isSupportedDrag } from './dropzoneUtils';

export interface CsvUploadDropzoneProps {
  onFileSelected: (file: File) => Promise<unknown>;
  isImporting: boolean;
  compact?: boolean;
  fullPageOverlay?: boolean;
  enableGlobalDrop?: boolean;
}

export const CsvUploadDropzone: React.FC<CsvUploadDropzoneProps> = React.memo(
  ({
    onFileSelected,
    isImporting,
    compact = false,
    fullPageOverlay = false,
    enableGlobalDrop = true,
  }) => {
    const { t } = useTranslation();
    const [isDragOverCard, setIsDragOverCard] = useState(false);
    const [isGlobalDragActive, setIsGlobalDragActive] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const globalDragCounter = useRef(0);

    // Global Drag & Drop Window Event Listeners
    const shouldListenGlobal = (fullPageOverlay || enableGlobalDrop) && !compact;

    useEffect(() => {
      if (!shouldListenGlobal) return;

      const handleWindowDragEnter = (e: DragEvent) => {
        if (!isSupportedDrag(e)) return;
        e.preventDefault();
        globalDragCounter.current += 1;
        if (globalDragCounter.current === 1) {
          setIsGlobalDragActive(true);
        }
      };

      const handleWindowDragOver = (e: DragEvent) => {
        if (!isSupportedDrag(e)) return;
        e.preventDefault();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
      };

      const handleWindowDragLeave = (e: DragEvent) => {
        e.preventDefault();
        globalDragCounter.current -= 1;
        if (globalDragCounter.current <= 0) {
          globalDragCounter.current = 0;
          setIsGlobalDragActive(false);
        }
      };

      const handleWindowDrop = async (e: DragEvent) => {
        e.preventDefault();
        globalDragCounter.current = 0;
        setIsGlobalDragActive(false);

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (isSupportedFile(file)) {
            await onFileSelected(file);
          }
        }
      };

      const handleWindowBlur = () => {
        globalDragCounter.current = 0;
        setIsGlobalDragActive(false);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          globalDragCounter.current = 0;
          setIsGlobalDragActive(false);
        }
      };

      window.addEventListener('dragenter', handleWindowDragEnter);
      window.addEventListener('dragover', handleWindowDragOver);
      window.addEventListener('dragleave', handleWindowDragLeave);
      window.addEventListener('drop', handleWindowDrop);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('dragenter', handleWindowDragEnter);
        window.removeEventListener('dragover', handleWindowDragOver);
        window.removeEventListener('dragleave', handleWindowDragLeave);
        window.removeEventListener('drop', handleWindowDrop);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [shouldListenGlobal, onFileSelected]);

    // Local Card Drag handlers
    const handleCardDragOver = useCallback((e: React.DragEvent) => {
      if (isSupportedDrag(e)) {
        e.preventDefault();
        setIsDragOverCard(true);
      }
    }, []);

    const handleCardDragLeave = useCallback(() => {
      setIsDragOverCard(false);
    }, []);

    const handleCardDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOverCard(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (isSupportedFile(file)) {
            await onFileSelected(file);
          }
        }
      },
      [onFileSelected]
    );

    const handleFileChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          await onFileSelected(file);
          e.target.value = '';
        }
      },
      [onFileSelected]
    );

    const handleInputTrigger = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    // Full-Page Pretty Dropzone Overlay Element
    const renderFullPageOverlay = () => {
      if (!isGlobalDragActive) return null;

      return (
        <Box
          data-testid="global-dropzone-overlay"
          aria-label="Full-page file dropzone"
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal + 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 3, md: 5 },
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.88),
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            animation: 'fadeIn 0.15s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          {/* Inner Pretty Border Frame */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              maxHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: (theme) => `2.5px dashed ${theme.palette.primary.main}`,
              borderRadius: { xs: 3, sm: 4 },
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
              boxShadow: (theme) => `0 0 48px ${alpha(theme.palette.primary.main, 0.2)}`,
              p: { xs: 2, sm: 4, md: 6 },
              textAlign: 'center',
              pointerEvents: 'none',
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Animated Pulsing Icon Ring */}
            <Box
              sx={{
                width: { xs: 72, sm: 96 },
                height: { xs: 72, sm: 96 },
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
                mb: 2.5,
                boxShadow: (theme) => `0 0 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                animation: 'pulseGlow 2s infinite ease-in-out',
                '@keyframes pulseGlow': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 0.9 },
                  '50%': { transform: 'scale(1.08)', opacity: 1 },
                },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: { xs: 36, sm: 52 } }} />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.2rem', sm: '1.6rem', md: '1.85rem' },
                letterSpacing: '-0.02em',
                mb: 1,
                color: 'text.primary',
              }}
            >
              {t('common.dropAnywhere')}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.85rem', sm: '1rem' },
                maxWidth: 540,
                mb: 3,
                lineHeight: 1.5,
              }}
            >
              {t('common.supportedBrokers')}
            </Typography>

            {/* Supported Format Badges */}
            <Box
              sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 3 }}
            >
              {SUPPORTED_EXTENSIONS.map((ext) => (
                <Chip
                  key={ext}
                  icon={<FilePresentOutlinedIcon sx={{ fontSize: 16 }} />}
                  label={ext.toUpperCase()}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    borderWidth: 1.5,
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  }}
                />
              ))}
            </Box>

            {/* Privacy Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
                color: 'success.main',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <SecurityOutlinedIcon sx={{ fontSize: 16 }} />
              <span>{t('common.clientSideProcessing')}</span>
            </Box>
          </Box>
        </Box>
      );
    };

    // If overlay-only mode requested (used at page level)
    if (fullPageOverlay) {
      return renderFullPageOverlay();
    }

    // Compact mode for toolbars
    if (compact) {
      return (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
            data-testid="compact-file-input"
          />
          <Button
            variant="contained"
            size="small"
            startIcon={
              isImporting ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />
            }
            onClick={handleInputTrigger}
            disabled={isImporting}
            data-testid="compact-upload-button"
            sx={{ height: 32, fontSize: '0.75rem', fontWeight: 600 }}
          >
            {t('common.uploadCsv')}
          </Button>
        </>
      );
    }

    // Default: Pretty Empty State Dropzone Card (with global overlay if enabled)
    return (
      <>
        {renderFullPageOverlay()}

        <Box
          onDragOver={handleCardDragOver}
          onDragLeave={handleCardDragLeave}
          onDrop={handleCardDrop}
          onClick={handleInputTrigger}
          role="button"
          tabIndex={0}
          aria-label={t('common.dragDrop')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleInputTrigger();
            }
          }}
          data-testid="csv-upload-dropzone-card"
          sx={{
            position: 'relative',
            border: (theme) =>
              `2px dashed ${isDragOverCard ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 3,
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            backgroundColor: (theme) =>
              isDragOverCard
                ? alpha(theme.palette.primary.main, 0.08)
                : alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(8px)',
            cursor: isImporting ? 'default' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: (theme) =>
              isDragOverCard
                ? `0 0 24px ${alpha(theme.palette.primary.main, 0.2)}`
                : '0 4px 20px rgba(0,0,0,0.04)',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              transform: 'translateY(-2px)',
            },
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
            data-testid="dropzone-file-input"
          />

          {isImporting ? (
            <CircularProgress size={44} sx={{ mb: 2 }} />
          ) : (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
                mb: 2,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.08)',
                },
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32 }} />
            </Box>
          )}

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.1rem' }, mb: 0.75 }}
          >
            {t('common.dragDrop')}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.8rem', maxWidth: 440, mx: 'auto', mb: 2.5, lineHeight: 1.4 }}
          >
            {t('common.supportedBrokers')}
          </Typography>

          {/* Supported format badges */}
          <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', mb: 2 }}>
            {SUPPORTED_EXTENSIONS.map((ext) => (
              <Chip
                key={ext}
                label={ext.toUpperCase()}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  height: 22,
                  borderColor: 'divider',
                  color: 'text.secondary',
                }}
              />
            ))}
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={<CloudUploadIcon />}
            disabled={isImporting}
            sx={{ px: 2.5, py: 0.6, fontSize: '0.8rem', borderRadius: 1.5, pointerEvents: 'none' }}
          >
            {t('common.uploadCsv')}
          </Button>
        </Box>
      </>
    );
  }
);

CsvUploadDropzone.displayName = 'CsvUploadDropzone';
