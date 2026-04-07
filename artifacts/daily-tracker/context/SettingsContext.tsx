import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "ar";
export type Theme = "light" | "dark";

const SETTINGS_KEY = "@lilt_settings_v1";

// ── Translations ──────────────────────────────────────────────────────────────
const translations = {
  en: {
    appTagline: "Daily Activity Tracker",
    selectPerson: "Who are you tracking?",
    selectPersonHas: "Select a person",
    addPerson: "Add Person",
    tapToOpen: "tap to open",
    emptyHint: "Add a person above to start tracking their daily activities.",
    logActivity: "Log Activity",
    dashboard: "Dashboard",
    editPerson: "Edit Person",
    addPersonTitle: "Add Person",
    pickColour: "Pick a colour",
    cancel: "Cancel",
    save: "Save",
    namePlaceholder: "Name (e.g. Bader)",
    settings: "Settings",
    language: "Language",
    english: "English",
    arabic: "عربي",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    addCustomHabit: "Add Custom Habit",
    noFavourites: "No favourites yet",
    noFavouritesHint: "Long-press any habit and tap ☆ to pin it here",
    longPress: "long-press",
  },
  ar: {
    appTagline: "متتبع النشاط اليومي",
    selectPerson: "من تتابع؟",
    selectPersonHas: "اختر شخصاً",
    addPerson: "إضافة شخص",
    tapToOpen: "اضغط للفتح",
    emptyHint: "أضف شخصاً لبدء تتبع أنشطته اليومية.",
    logActivity: "تسجيل النشاط",
    dashboard: "لوحة التحكم",
    editPerson: "تعديل الشخص",
    addPersonTitle: "إضافة شخص",
    pickColour: "اختر لوناً",
    cancel: "إلغاء",
    save: "حفظ",
    namePlaceholder: "الاسم (مثال: بدر)",
    settings: "الإعدادات",
    language: "اللغة",
    english: "English",
    arabic: "عربي",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    addCustomHabit: "إضافة نشاط مخصص",
    noFavourites: "لا توجد مفضلة بعد",
    noFavouritesHint: "اضغط مطولاً على أي نشاط واضغط ☆ لتثبيته هنا",
    longPress: "اضغط مطولاً",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

// ── Context ───────────────────────────────────────────────────────────────────
interface SettingsContextValue {
  language: Language;
  theme: Theme;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: TranslationKey) => string;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((v) => {
        if (v) {
          const s = JSON.parse(v);
          if (s.language) setLanguageState(s.language);
          if (s.theme) setThemeState(s.theme);
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((lang: Language, thm: Theme) => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: lang, theme: thm })).catch(() => {});
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    persist(lang, theme);
  }, [theme, persist]);

  const setTheme = useCallback((thm: Theme) => {
    setThemeState(thm);
    persist(language, thm);
  }, [language, persist]);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] as string;
  }, [language]);

  const isRTL = language === "ar";

  return (
    <SettingsContext.Provider value={{ language, theme, isRTL, setLanguage, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
