import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveJournalSettings } from '../lib/db';
import { JournalSettings, DEFAULT_JOURNAL_SETTINGS } from '../types/preferences';
import { GroupByOption, SortOrder } from '../types/trade';

export function useJournalSettings() {
  const settingsRecord = useLiveQuery(async () => {
    const record = await db.settings.get('journalSettings');
    return record?.value as JournalSettings | undefined;
  }, []);

  const settings: JournalSettings = settingsRecord
    ? { ...DEFAULT_JOURNAL_SETTINGS, ...settingsRecord }
    : DEFAULT_JOURNAL_SETTINGS;

  const updateSettings = async (newSettings: Partial<JournalSettings>) => {
    const updated = { ...settings, ...newSettings };
    await saveJournalSettings(updated);
  };

  const updateInitialDeposit = async (amount: number) => {
    await updateSettings({ initialDeposit: Math.max(0, amount) });
  };

  const setGroupBy = async (groupBy: GroupByOption) => {
    await updateSettings({ groupBy });
  };

  const toggleSortOrder = async () => {
    const newOrder: SortOrder = settings.sortOrder === 'asc' ? 'desc' : 'asc';
    await updateSettings({ sortOrder: newOrder });
  };

  return {
    settings,
    updateSettings,
    updateInitialDeposit,
    setGroupBy,
    toggleSortOrder,
  };
}
