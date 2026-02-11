import { LazyStore } from "@tauri-apps/plugin-store";
import type { StateStorage } from "zustand/middleware";
import type { AppSettingsState } from "../store/app-setting";

export const SETTING_FILE = "settings.json";

export const defaultAppSettings: AppSettingsState = {
    minimizeToTray: false,
    startOnBoot: false,
    enableNotifications: true,
    darkMode: false,
    autoUpdate: true,
    showProgressOnIcon: false,
};
export const localSettingStore = new LazyStore(SETTING_FILE, {
    autoSave: true,
    defaults: defaultAppSettings,
});
export const localSettingLazyStoreStorage: StateStorage = {
    getItem: async (name: string) => {
        const value = await localSettingStore.get<string>(name);
        return value || null;
    },
    setItem: async (name: string, value: string) => {
        await localSettingStore.set(name, value);
        await localSettingStore.save();
    },
    removeItem: async (name: string) => {
        await localSettingStore.delete(name);
    },
};
