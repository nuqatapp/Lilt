import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "ar";
export type Theme = "light" | "dark";

const SETTINGS_KEY = "@lilt_settings_v1";

// ── Translations ──────────────────────────────────────────────────────────────
/**
 * Complete translation dictionary for English and Arabic.
 * 
 * Format:
 * - Key: Translation identifier (camelCase)
 * - Value: Translated string for that language
 * 
 * To add new translations:
 * 1. Add key to BOTH en and ar objects
 * 2. Use t("keyName") in components
 * 
 * Arabic note: Use proper RTL text. Platform handles layout direction automatically.
 */
const translations = {
  en: {
    // ── App Core ──────────────────────────────────────────────────────────────
    appTagline: "Daily Activity Tracker",
    selectPerson: "Who are you tracking?",
    selectPersonHas: "Select a person",
    addPerson: "Add Person",
    tapToOpen: "tap to open",
    emptyHint: "Add a person above to start tracking their daily activities.",
    
    // ── Main Navigation ──────────────────────────────────────────────────────
    logActivity: "Log Activity",
    dashboard: "Dashboard",
    
    // ── Person Management ────────────────────────────────────────────────────
    editPerson: "Edit Person",
    addPersonTitle: "Add Person",
    pickColour: "Pick a colour",
    cancel: "Cancel",
    save: "Save",
    namePlaceholder: "Name (e.g. Bader)",
    
    // ── Settings ──────────────────────────────────────────────────────────────
    settings: "Settings",
    language: "Language",
    english: "English",
    arabic: "عربي",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    
    // ── Data Management / Backup & Export ────────────────────────────────────
    dataManagement: "Data Management",
    exportData: "Export Data",
    exportDataDesc: "Save all your data as a file",
    importData: "Restore from Backup",
    importDataDesc: "Load data from a previously saved file",
    clearAllData: "Clear All Data",
    clearAllDataDesc: "Permanently delete all logs and habits",
    
    // ── Alerts & Messages ────────────────────────────────────────────────────
    exportSuccess: "Data exported successfully",
    exportError: "Failed to export data",
    importSuccess: "Data restored successfully",
    importError: "Failed to restore data",
    clearConfirm: "Are you sure?",
    clearConfirmMessage: "This will permanently delete all your activity logs and custom habits. This cannot be undone.",
    clearSuccess: "All data cleared",
    clearing: "Clearing...",
    exporting: "Exporting...",
    importing: "Importing...",
    deleteAll: "Delete All",
    
    // ── Habits (Default) ─────────────────────────────────────────────────────
    shower: "Shower",
    bathroom: "Bathroom",
    eating: "Eating",
    drinkingWater: "Drinking water",
    sleeping: "Sleeping",
    stretching: "Stretching",
    exercise: "Exercise",
    medication: "Medication",
    work: "Work",
    learning: "Learning",
    creative: "Creative",
    cleaning: "Cleaning",
    cooking: "Cooking",
    familyTime: "Family time",
    childcare: "Childcare",
    walking: "Walking",
    resting: "Resting",
    socializing: "Socializing",
    screenTime: "Screen time",
    prayerMindfulness: "Prayer",
    hobbies: "Hobbies",
    outdoorTime: "Outdoor time",
    
    // ── Habit Groups ──────────────────────────────────────────────────────────
    body: "Body",
    productivity: "Productivity",
    home: "Home",
    lifestyle: "Lifestyle",
    
    // ── Custom Habits ─────────────────────────────────────────────────────────
    addCustomHabit: "Add Custom Habit",
    customHabit: "Custom Habit",
    
    // ── Favorites ─────────────────────────────────────────────────────────────
    noFavourites: "No favourites yet",
    noFavouritesHint: "Long-press any habit and tap ☆ to pin it here",
    longPress: "long-press",
    
    // ── Charts & Analytics ────────────────────────────────────────────────────
    thisWeek: "This week",
    count: "Count",
    noData: "No data yet",
  },
  
  ar: {
    // ── App Core ──────────────────────────────────────────────────────────────
    appTagline: "متتبع النشاط اليومي",
    selectPerson: "من تتابع؟",
    selectPersonHas: "اختر شخصاً",
    addPerson: "إضافة شخص",
    tapToOpen: "اضغط للفتح",
    emptyHint: "أضف شخصاً لبدء تتبع أنشطته اليومية.",
    
    // ── Main Navigation ──────────────────────────────────────────────────────
    logActivity: "تسجيل النشاط",
    dashboard: "لوحة التحكم",
    
    // ── Person Management ────────────────────────────────────────────────────
    editPerson: "تعديل الشخص",
    addPersonTitle: "إضافة شخص",
    pickColour: "اختر لوناً",
    cancel: "إلغاء",
    save: "حفظ",
    namePlaceholder: "الاسم (مثال: بدر)",
    
    // ── Settings ──────────────────────────────────────────────────────────────
    settings: "الإعدادات",
    language: "اللغة",
    english: "English",
    arabic: "عربي",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    
    // ── Data Management / Backup & Export ────────────────────────────────────
    dataManagement: "إدارة البيانات",
    exportData: "تصدير البيانات",
    exportDataDesc: "احفظ جميع بياناتك في ملف",
    importData: "استعادة من النسخة الاحتياطية",
    importDataDesc: "حمل البيانات من ملف محفوظ سابقاً",
    clearAllData: "حذف جميع البيانات",
    clearAllDataDesc: "احذف نهائياً جميع السجلات والعادات المخصصة. لا يمكن التراجع عن هذا.",
    
    // ── Alerts & Messages ────────────────────────────────────────────────────
    exportSuccess: "تم تصدير البيانات بنجاح",
    exportError: "فشل تصدير البيانات",
    importSuccess: "تم استعادة البيانات بنجاح",
    importError: "فشل استعادة البيانات",
    clearConfirm: "هل أنت متأكد؟",
    clearConfirmMessage: "سيؤدي هذا إلى حذف جميع سجلاتك النشاطية والعادات المخصصة نهائياً. لا يمكن التراجع عن هذا.",
    clearSuccess: "تم حذف جميع البيانات",
    clearing: "جاري الحذف...",
    exporting: "جاري التصدير...",
    importing: "جاري الاستيراد...",
    deleteAll: "حذف الكل",
    
    // ── Habits (Default) ─────────────────────────────────────────────────────
    shower: "الاستحمام",
    bathroom: "الحمام",
    eating: "الأكل",
    drinkingWater: "شرب الماء",
    sleeping: "النوم",
    stretching: "التمديد",
    exercise: "الرياضة",
    medication: "الأدوية",
    work: "العمل",
    learning: "التعلم",
    creative: "الإبداع",
    cleaning: "التنظيف",
    cooking: "الطبخ",
    familyTime: "الوقت العائلي",
    childcare: "رعاية الأطفال",
    walking: "المشي",
    resting: "الراحة",
    socializing: "التفاعل الاجتماعي",
    screenTime: "وقت الشاشة",
    prayerMindfulness: "الصلاة",
    hobbies: "الهوايات",
    outdoorTime: "الوقت في الخارج",
    
    // ── Habit Groups ──────────────────────────────────────────────────────────
    body: "الجسد",
    productivity: "الإنتاجية",
    home: "المنزل",
    lifestyle: "نمط الحياة",
    
    // ── Custom Habits ─────────────────────────────────────────────────────────
    addCustomHabit: "إضافة نشاط مخصص",
    customHabit: "نشاط مخصص",
    
    // ── Favorites ─────────────────────────────────────────────────────────────
    noFavourites: "لا توجد مفضلة بعد",
    noFavouritesHint: "اضغط مطولاً على أي نشاط واضغط ☆ لتثبيته هنا",
    longPress: "اضغط مطولاً",
    
    // ── Charts & Analytics ────────────────────────────────────────────────────
    thisWeek: "هذا الأسبوع",
    count: "العدد",
    noData: "لا توجد بيانات حتى الآن",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

/**
 * SettingsContextValue: The public API of the Settings system.
 * 
 * - language: Current language ("en" or "ar")
 * - theme: Current theme ("light" or "dark")
 * - isRTL: True if Arabic (for right-to-left layout)
 * - setLanguage: Change language
 * - setTheme: Change theme
 * - t: Translate function (t("keyName") returns translated string)
 */
interface SettingsContextValue {
  language: Language;
  theme: Theme;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (key: TranslationKey) => string;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * SettingsProvider: Context provider for app-wide settings.
 * 
 * Manages:
 * - Language (en/ar)
 * - Theme (light/dark)
 * - RTL layout direction
 * - Translation function
 * - Persistence to AsyncStorage
 * 
 * Must wrap the entire app (done in app/_layout.tsx)
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("light");

  /**
   * Load saved settings from AsyncStorage on app startup.
   * If no saved settings, defaults are used (English, Light).
   */
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((v) => {
        if (v) {
          const s = JSON.parse(v);
          if (s.language) setLanguageState(s.language);
          if (s.theme) setThemeState(s.theme);
        }
      })
      .catch(() => {
        // Silent fail - use defaults
      });
  }, []);

  /**
   * Save settings to AsyncStorage whenever they change.
   * Ensures language/theme preferences persist across app restarts.
   */
  const persist = useCallback((lang: Language, thm: Theme) => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: lang, theme: thm })).catch(
      () => {
        // Silent fail - local state is still updated
        // User will see change but it won't persist on app restart
      }
    );
  }, []);

  /**
   * Change language and persist.
   * Triggers re-render of all components using t() function.
   */
  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      persist(lang, theme);
    },
    [theme, persist]
  );

  /**
   * Change theme and persist.
   * Triggers re-render of all components using useColors() hook.
   */
  const setTheme = useCallback(
    (thm: Theme) => {
      setThemeState(thm);
      persist(language, thm);
    },
    [language, persist]
  );

  /**
   * Translate a key to the current language.
   * 
   * Usage:
   *   const { t } = useSettings();
   *   <Text>{t("logActivity")}</Text>  // Shows "Log Activity" or "تسجيل النشاط"
   * 
   * Key must exist in both en and ar translation objects.
   * If key is missing, TypeScript will catch it at compile time.
   */
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

/**
 * useSettings Hook: Access app settings anywhere.
 * 
 * Must be called inside a component wrapped by SettingsProvider.
 * 
 * Example:
 *   const { t, language, setLanguage } = useSettings();
 */
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
