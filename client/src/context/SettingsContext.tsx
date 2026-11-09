import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PublicSettings, SettingsUpdate, ThemeId } from '../../../shared/types';
import { api, errorMessage } from '../api';

const THEME_KEY = 'rc:theme';

interface SettingsContextValue {
  settings: PublicSettings | null;
  loading: boolean;
  error: string | null;
  save: (update: SettingsUpdate) => Promise<PublicSettings>;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // A preferência visual também é persistida no servidor.
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await api.getSettings();
      setSettings(loaded);
      applyTheme(loaded.theme);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (update: SettingsUpdate) => {
    const next = await api.saveSettings(update);
    setSettings(next);
    applyTheme(next.theme);
    return next;
  }, []);

  const value = useMemo(
    () => ({ settings, loading, error, save, reload: load }),
    [settings, loading, error, save, load],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings deve ser usado dentro de SettingsProvider.');
  return context;
}
