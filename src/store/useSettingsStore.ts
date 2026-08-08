import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings } from '../types';
import { api } from '../services/api';

interface SettingsStore {
  settings: Partial<UserSettings> & { transparency_pct?: number };
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings> & { transparency_pct?: number }) => Promise<void>;
}

const applyThemeTokens = (accent?: string, transparency?: number) => {
  if (accent) {
    document.documentElement.setAttribute('data-accent', accent);
  }
  if (transparency !== undefined && transparency !== null) {
    document.documentElement.style.setProperty('--transparency-pct', String(transparency));
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: {
        theme: 'dark',
        theme_preset: 'default',
        background_type: 'preset',
        background_value: 'aurora',
        background_opacity: 0.15,
        accent_color: 'blue',
        transparency_pct: 25, // 0 = Solid, 100 = Fully Transparent
        default_model: 'gemini-2.5-flash',
        enter_to_send: true,
        show_timestamps: true,
        stream_responses: true,
      },
      isLoading: false,
      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get<UserSettings>('/settings');
          // Merge with current state to preserve transparency_pct if fallback
          const merged = { ...get().settings, ...res.data };
          set({ settings: merged, isLoading: false });
          applyThemeTokens(merged.accent_color, merged.transparency_pct);
        } catch (e) {
          set({ isLoading: false });
        }
      },
      updateSettings: async (newSettings) => {
        applyThemeTokens(newSettings.accent_color, newSettings.transparency_pct);
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        try {
          const res = await api.patch<UserSettings>('/settings', newSettings);
          const merged = { ...get().settings, ...res.data };
          set({ settings: merged });
          applyThemeTokens(merged.accent_color, merged.transparency_pct);
        } catch (e) {
          // Local settings preserved
        }
      },
    }),
    {
      name: 'ai-chat-settings-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.settings) {
          applyThemeTokens(state.settings.accent_color, state.settings.transparency_pct);
        }
      },
    }
  )
);
