import { useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveJournalSettings } from '../lib/db';
import {
  JournalSettings,
  DEFAULT_JOURNAL_SETTINGS,
  PageBlockId,
  DEFAULT_PAGE_BLOCK_ORDER,
} from '../types/preferences';
import { GroupByOption, SortOrder } from '../types/trade';

export function useJournalSettings() {
  const settingsRecord = useLiveQuery(async () => {
    const record = await db.settings.get('journalSettings');
    return record?.value as JournalSettings | undefined;
  }, []);

  const settings: JournalSettings = useMemo(() => {
    if (!settingsRecord) return DEFAULT_JOURNAL_SETTINGS;

    const rawBlockOrder = settingsRecord.pageBlockOrder || DEFAULT_PAGE_BLOCK_ORDER;
    const rawBlockSet = new Set(rawBlockOrder);
    const validatedBlockOrder: PageBlockId[] = [
      ...rawBlockOrder.filter((id): id is PageBlockId =>
        DEFAULT_PAGE_BLOCK_ORDER.includes(id as PageBlockId)
      ),
      ...DEFAULT_PAGE_BLOCK_ORDER.filter((id) => !rawBlockSet.has(id)),
    ];

    return {
      ...DEFAULT_JOURNAL_SETTINGS,
      ...settingsRecord,
      pageBlockOrder: validatedBlockOrder,
      hiddenPageBlocks: settingsRecord.hiddenPageBlocks || [],
    };
  }, [settingsRecord]);

  const updateSettings = useCallback(
    async (newSettings: Partial<JournalSettings>) => {
      const updated = { ...settings, ...newSettings };
      await saveJournalSettings(updated);
    },
    [settings]
  );

  const updateInitialDeposit = useCallback(
    async (amount: number) => {
      await updateSettings({ initialDeposit: Math.max(0, amount) });
    },
    [updateSettings]
  );

  const setGroupBy = useCallback(
    async (groupBy: GroupByOption) => {
      await updateSettings({ groupBy });
    },
    [updateSettings]
  );

  const toggleSortOrder = useCallback(async () => {
    const newOrder: SortOrder = settings.sortOrder === 'asc' ? 'desc' : 'asc';
    await updateSettings({ sortOrder: newOrder });
  }, [settings.sortOrder, updateSettings]);

  const updatePageBlockOrder = useCallback(
    async (order: PageBlockId[]) => {
      await updateSettings({ pageBlockOrder: order });
    },
    [updateSettings]
  );

  const togglePageBlockVisibility = useCallback(
    async (blockId: PageBlockId) => {
      const currentHidden = settings.hiddenPageBlocks || [];
      const isHidden = currentHidden.includes(blockId);
      const updatedHidden = isHidden
        ? currentHidden.filter((id) => id !== blockId)
        : [...currentHidden, blockId];
      await updateSettings({ hiddenPageBlocks: updatedHidden });
    },
    [settings.hiddenPageBlocks, updateSettings]
  );

  const resetPageBlocksLayout = useCallback(async () => {
    await updateSettings({
      pageBlockOrder: DEFAULT_PAGE_BLOCK_ORDER,
      hiddenPageBlocks: [],
    });
  }, [updateSettings]);

  const showAllPageBlocks = useCallback(async () => {
    await updateSettings({
      hiddenPageBlocks: [],
    });
  }, [updateSettings]);

  return useMemo(
    () => ({
      settings,
      updateSettings,
      updateInitialDeposit,
      setGroupBy,
      toggleSortOrder,
      updatePageBlockOrder,
      togglePageBlockVisibility,
      resetPageBlocksLayout,
      showAllPageBlocks,
    }),
    [
      settings,
      updateSettings,
      updateInitialDeposit,
      setGroupBy,
      toggleSortOrder,
      updatePageBlockOrder,
      togglePageBlockVisibility,
      resetPageBlocksLayout,
      showAllPageBlocks,
    ]
  );
}
