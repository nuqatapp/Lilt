/**
 * DataBackup.ts
 * 
 * Utilities for exporting, importing, and clearing all app data.
 * 
 * Features:
 * - Export all logs and habits as JSON
 * - Import from previously exported JSON
 * - Clear all data with confirmation
 * - Error handling with user feedback
 * 
 * Usage:
 *   import { exportData, importData, clearAllData } from '@/utils/DataBackup';
 *   
 *   // Export data to file
 *   const { success, message } = await exportData();
 *   
 *   // Import from file
 *   const { success, message } = await importData();
 *   
 *   // Clear all data
 *   const { success, message } = await clearAllData();
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * Storage keys for all app data.
 * Must match the keys used in HabitsContext, LogContext, etc.
 */
const STORAGE_KEYS = {
  HABITS: "@trace_custom_habits_v1",
  LOGS: "@trace_logs_v1",
  FAVORITES: "@lilt_favorites_v2",
  SETTINGS: "@lilt_settings_v1",
  PEOPLE: "@lilt_people_v1", // If using PeopleContext
};

/**
 * Structure of exported data file.
 * Includes all app data with metadata.
 */
interface ExportedData {
  version: "1.0";
  exportedAt: string; // ISO timestamp
  appVersion: "0.0.1";
  data: {
    habits?: string; // JSON stringified
    logs?: string;
    favorites?: string;
    settings?: string;
    people?: string;
  };
}

/**
 * Export all app data to a JSON file.
 * 
 * Process:
 * 1. Read all data from AsyncStorage
 * 2. Create a backup object with metadata
 * 3. Save to device file system
 * 4. Open share dialog so user can save/email the file
 * 
 * Returns:
 *   - success: true if export completed
 *   - message: User-friendly message
 *   - filePath: Path to exported file (if successful)
 */
export async function exportData(t: (key: string) => string): Promise<{
  success: boolean;
  message: string;
  filePath?: string;
}> {
  try {
    // Read all data from AsyncStorage
    const [habitsStr, logsStr, favoritesStr, settingsStr, peopleStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.HABITS),
      AsyncStorage.getItem(STORAGE_KEYS.LOGS),
      AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.PEOPLE),
    ]);

    // Create backup object
    const backup: ExportedData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      appVersion: "0.0.1",
      data: {
        habits: habitsStr || undefined,
        logs: logsStr || undefined,
        favorites: favoritesStr || undefined,
        settings: settingsStr || undefined,
        people: peopleStr || undefined,
      },
    };

    // Create file path
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `lilt-backup-${timestamp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Write to file system
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

    // Open share dialog
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Save Lilt Backup",
        UTI: "public.json",
      });
    }

    return {
      success: true,
      message: t("exportSuccess"),
      filePath,
    };
  } catch (error) {
    console.error("Export failed:", error);
    return {
      success: false,
      message: t("exportError"),
    };
  }
}

/**
 * Import data from a previously exported JSON file.
 * 
 * Process:
 * 1. User selects a file (via file picker)
 * 2. Read and parse the JSON
 * 3. Validate format
 * 4. Restore to AsyncStorage
 * 5. Reload app or refresh contexts
 * 
 * Note: This is a simplified version.
 * A production implementation would use FilePicker to let user choose a file.
 * For now, this is a placeholder that shows the structure.
 * 
 * Returns:
 *   - success: true if import completed
 *   - message: User-friendly message
 */
export async function importData(
  jsonString: string,
  t: (key: string) => string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Parse JSON
    const backup: ExportedData = JSON.parse(jsonString);

    // Validate format
    if (!backup.version || backup.version !== "1.0") {
      return {
        success: false,
        message: t("importError"),
      };
    }

    // Restore data to AsyncStorage
    const promises = [];

    if (backup.data.habits) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.HABITS, backup.data.habits)
      );
    }

    if (backup.data.logs) {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.LOGS, backup.data.logs));
    }

    if (backup.data.favorites) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, backup.data.favorites)
      );
    }

    if (backup.data.settings) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, backup.data.settings)
      );
    }

    if (backup.data.people) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.PEOPLE, backup.data.people)
      );
    }

    await Promise.all(promises);

    return {
      success: true,
      message: t("importSuccess"),
    };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      message: t("importError"),
    };
  }
}

/**
 * Clear all app data.
 * 
 * DESTRUCTIVE: Permanently deletes all logs, habits, favorites, etc.
 * Should only be called after explicit user confirmation.
 * 
 * Process:
 * 1. Clear all AsyncStorage keys
 * 2. Reset app to fresh state
 * 3. Show success message
 * 
 * Returns:
 *   - success: true if cleared
 *   - message: User-friendly message
 */
export async function clearAllData(t: (key: string) => string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Remove all keys
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.HABITS),
      AsyncStorage.removeItem(STORAGE_KEYS.LOGS),
      AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.PEOPLE),
    ]);

    return {
      success: true,
      message: t("clearSuccess"),
    };
  } catch (error) {
    console.error("Clear failed:", error);
    return {
      success: false,
      message: t("exportError"),
    };
  }
}

/**
 * Helper: Format backup size for display.
 * 
 * Example: calculateBackupSize() → "2.3 MB"
 */
export async function calculateBackupSize(): Promise<string> {
  try {
    const [habitsStr, logsStr, favoritesStr, settingsStr, peopleStr] =
      await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.HABITS),
        AsyncStorage.getItem(STORAGE_KEYS.LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.PEOPLE),
      ]);

    const totalSize =
      (habitsStr?.length || 0) +
      (logsStr?.length || 0) +
      (favoritesStr?.length || 0) +
      (settingsStr?.length || 0) +
      (peopleStr?.length || 0);

    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
  } catch {
    return "Unknown";
  }
}
