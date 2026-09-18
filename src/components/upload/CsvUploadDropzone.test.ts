import { describe, it, expect } from 'vitest';
import {
  isSupportedFile,
  isSupportedDrag,
  SUPPORTED_EXTENSIONS,
  BLOCKED_MIME_PREFIXES,
  BLOCKED_MIME_EXACT,
} from './dropzoneUtils';

describe('CsvUploadDropzone validation and drag helpers', () => {
  describe('SUPPORTED_EXTENSIONS', () => {
    it('supports .csv, .tsv, and .txt', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('.csv');
      expect(SUPPORTED_EXTENSIONS).toContain('.tsv');
      expect(SUPPORTED_EXTENSIONS).toContain('.txt');
    });
  });

  describe('isSupportedFile', () => {
    it('accepts files with valid extensions regardless of case', () => {
      const validNames = [
        'trades.csv',
        'EXPORT.CSV',
        'statement.tsv',
        'ACCOUNT.TSV',
        'broker_export.txt',
        'ORDERS.TXT',
      ];

      validNames.forEach((name) => {
        const file = new File(['mock content'], name, { type: 'text/plain' });
        expect(isSupportedFile(file)).toBe(true);
      });
    });

    it('rejects unsupported file formats', () => {
      const invalidNames = [
        'screenshot.png',
        'document.pdf',
        'data.json',
        'trades.xlsx',
        'archive.zip',
        'video.mp4',
        'no_extension',
      ];

      invalidNames.forEach((name) => {
        const file = new File(['mock content'], name, { type: 'application/octet-stream' });
        expect(isSupportedFile(file)).toBe(false);
      });
    });

    it('handles null/undefined/empty file edge cases safely', () => {
      expect(isSupportedFile(null as unknown as File)).toBe(false);
      expect(isSupportedFile(undefined as unknown as File)).toBe(false);
      expect(isSupportedFile({} as unknown as File)).toBe(false);
    });
  });

  describe('isSupportedDrag', () => {
    it('rejects events without dataTransfer or without Files in types', () => {
      expect(isSupportedDrag({} as unknown as DragEvent)).toBe(false);

      const textDragEvent = {
        dataTransfer: {
          types: ['text/plain'],
          items: [],
        },
      } as unknown as DragEvent;
      expect(isSupportedDrag(textDragEvent)).toBe(false);
    });

    it('accepts events with Files type and valid or empty MIME types', () => {
      const validCsvDragEvent = {
        dataTransfer: {
          types: ['Files'],
          items: [{ kind: 'file', type: 'text/csv' }],
        },
      } as unknown as DragEvent;
      expect(isSupportedDrag(validCsvDragEvent)).toBe(true);

      const emptyMimeDragEvent = {
        dataTransfer: {
          types: ['Files'],
          items: [{ kind: 'file', type: '' }],
        },
      } as unknown as DragEvent;
      expect(isSupportedDrag(emptyMimeDragEvent)).toBe(true);

      const excelMimeDragEvent = {
        dataTransfer: {
          types: ['Files'],
          items: [{ kind: 'file', type: 'application/vnd.ms-excel' }],
        },
      } as unknown as DragEvent;
      expect(isSupportedDrag(excelMimeDragEvent)).toBe(true);
    });

    it('rejects drag events with explicitly blocked MIME types (images, videos, PDF, zip, json)', () => {
      const blockedMimes = [
        'image/png',
        'image/jpeg',
        'video/mp4',
        'audio/mpeg',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/json',
      ];

      blockedMimes.forEach((mime) => {
        const blockedDragEvent = {
          dataTransfer: {
            types: ['Files'],
            items: [{ kind: 'file', type: mime }],
          },
        } as unknown as DragEvent;
        expect(isSupportedDrag(blockedDragEvent)).toBe(false);
      });
    });

    it('rejects items where kind is not file', () => {
      const nonFileItemEvent = {
        dataTransfer: {
          types: ['Files'],
          items: [{ kind: 'string', type: 'text/plain' }],
        },
      } as unknown as DragEvent;
      expect(isSupportedDrag(nonFileItemEvent)).toBe(false);
    });
  });

  describe('Security and MIME block lists', () => {
    it('covers major dangerous or irrelevant MIME formats', () => {
      expect(BLOCKED_MIME_PREFIXES).toContain('image/');
      expect(BLOCKED_MIME_PREFIXES).toContain('video/');
      expect(BLOCKED_MIME_PREFIXES).toContain('audio/');

      expect(BLOCKED_MIME_EXACT).toContain('application/pdf');
      expect(BLOCKED_MIME_EXACT).toContain('application/zip');
      expect(BLOCKED_MIME_EXACT).toContain('application/json');
    });
  });
});
