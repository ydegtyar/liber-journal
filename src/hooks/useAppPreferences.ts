import { useContext } from 'react';
import { PreferencesContext, PreferencesContextValue } from '../context/preferencesContextInstance';

export { PreferencesProvider } from '../context/PreferencesContext';
export type { PreferencesContextValue };

export function useAppPreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
