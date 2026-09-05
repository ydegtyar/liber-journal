import { describe, it, expect } from 'vitest';
import { BLOCK_CONFIGS } from './blockConfigs.tsx';
import {
  DEFAULT_PAGE_BLOCK_ORDER,
  PageBlockId,
  DEFAULT_JOURNAL_SETTINGS,
} from '../../types/preferences';
import { arrayMove } from '@dnd-kit/sortable';
import enLocale from '../../i18n/locales/en.json';
import ukLocale from '../../i18n/locales/uk.json';

describe('PageLayoutSettingsDrawer & Block Layout Configuration', () => {
  it('contains configurations for all 8 default page blocks', () => {
    expect(DEFAULT_PAGE_BLOCK_ORDER).toHaveLength(8);

    const configuredBlockIds = Object.keys(BLOCK_CONFIGS);
    expect(configuredBlockIds.sort()).toEqual([...DEFAULT_PAGE_BLOCK_ORDER].sort());
  });

  it('has valid content-based translation names and descriptions in en.json', () => {
    const layoutBlocks = enLocale.layoutSettings.blocks;

    DEFAULT_PAGE_BLOCK_ORDER.forEach((blockId) => {
      const config = BLOCK_CONFIGS[blockId];
      expect(config).toBeDefined();
      expect(config.icon).toBeDefined();

      // Verify that translation key resolves in en.json
      const blockTrans = layoutBlocks[blockId as keyof typeof layoutBlocks];
      expect(blockTrans).toBeDefined();
      expect(blockTrans.name).toBeTruthy();
      expect(blockTrans.description).toBeTruthy();
    });
  });

  it('has valid content-based translation names and descriptions in uk.json', () => {
    const layoutBlocks = ukLocale.layoutSettings.blocks;

    DEFAULT_PAGE_BLOCK_ORDER.forEach((blockId) => {
      const blockTrans = layoutBlocks[blockId as keyof typeof layoutBlocks];
      expect(blockTrans).toBeDefined();
      expect(blockTrans.name).toBeTruthy();
      expect(blockTrans.description).toBeTruthy();
    });
  });

  it('reorders page blocks correctly with arrayMove', () => {
    const initialOrder: PageBlockId[] = [...DEFAULT_PAGE_BLOCK_ORDER];

    // Move 'tradesView' (last item, index 7) to the top (index 0)
    const reordered = arrayMove(initialOrder, 7, 0);

    expect(reordered[0]).toBe('tradesView');
    expect(reordered[1]).toBe('timeframeBanner');
    expect(reordered).toHaveLength(8);
  });

  it('handles block visibility toggling correctly', () => {
    let hiddenBlocks: PageBlockId[] = [];

    // Hide monthlyReturns
    const toggleBlock = (id: PageBlockId) => {
      hiddenBlocks = hiddenBlocks.includes(id)
        ? hiddenBlocks.filter((b) => b !== id)
        : [...hiddenBlocks, id];
    };

    toggleBlock('monthlyReturns');
    expect(hiddenBlocks).toEqual(['monthlyReturns']);

    // Hide streakAnalysis
    toggleBlock('streakAnalysis');
    expect(hiddenBlocks).toEqual(['monthlyReturns', 'streakAnalysis']);

    // Unhide monthlyReturns
    toggleBlock('monthlyReturns');
    expect(hiddenBlocks).toEqual(['streakAnalysis']);

    // Filter visible blocks
    const visibleBlocks = DEFAULT_PAGE_BLOCK_ORDER.filter((id) => !hiddenBlocks.includes(id));
    expect(visibleBlocks).toHaveLength(7);
    expect(visibleBlocks.includes('streakAnalysis')).toBe(false);
  });

  it('initializes default journal settings with full pageBlockOrder and empty hidden list', () => {
    expect(DEFAULT_JOURNAL_SETTINGS.pageBlockOrder).toEqual(DEFAULT_PAGE_BLOCK_ORDER);
    expect(DEFAULT_JOURNAL_SETTINGS.hiddenPageBlocks).toEqual([]);
  });

  it('provides dropSlot translation in en and uk locales for section drag placeholder', () => {
    expect(enLocale.layoutSettings.dropSlot).toBe('Drop section here');
    expect(ukLocale.layoutSettings.dropSlot).toBe('Перетягніть блок сюди');
  });
});
