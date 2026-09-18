import React from 'react';

export const SUPPORTED_EXTENSIONS = ['.csv', '.tsv', '.txt'] as const;

export const BLOCKED_MIME_PREFIXES = ['image/', 'video/', 'audio/'] as const;
export const BLOCKED_MIME_EXACT = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-tar',
  'application/x-bzip2',
  'application/x-7z-compressed',
  'application/json',
  'application/xml',
  'text/html',
] as const;

/**
 * Validates whether a file object has a supported broker export extension (.csv, .tsv, .txt)
 */
export function isSupportedFile(file: File): boolean {
  if (!file || !file.name) return false;
  const lower = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Inspects drag event metadata to determine if a supported file is being dragged.
 * Rejects non-file drags (e.g. text selections, links) and files with explicitly
 * blocked MIME types (images, videos, PDFs, zip archives).
 */
export function isSupportedDrag(e: DragEvent | React.DragEvent): boolean {
  if (!e.dataTransfer) return false;
  const types = e.dataTransfer.types;
  if (!types) return false;
  const typesArray = Array.from(types);
  if (!typesArray.includes('Files')) return false;

  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const item = e.dataTransfer.items[i];
      if (item.kind && item.kind !== 'file') {
        return false;
      }
      if (item.type) {
        const type = item.type.toLowerCase();
        if (BLOCKED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix))) {
          return false;
        }
        if (BLOCKED_MIME_EXACT.some((exact) => type === exact)) {
          return false;
        }
      }
    }
  }

  return true;
}
