import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const STORAGE_KEYS = [
  "@trace_logs_v1",
  "@trace_custom_habits_v1",
  "@lilt_favorites_v2",
  "@lilt_people_v1",
  "@lilt_settings_v1",
  "@trace_dashboard_settings_v1",
] as const;

interface BackupPayload {
  version: "1.0";
  exportedAt: string;
  appName: "lilt";
  data: Partial<Record<(typeof STORAGE_KEYS)[number], string>>;
}

export async function exportData(): Promise<{ success: boolean; message: string; filePath?: string }> {
  try {
    const pairs = await AsyncStorage.multiGet([...STORAGE_KEYS]);
    const data: BackupPayload["data"] = {};
    for (const [key, value] of pairs) {
      if (value !== null) {
        data[key as (typeof STORAGE_KEYS)[number]] = value;
      }
    }

    const payload: BackupPayload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      appName: "lilt",
      data,
    };

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `lilt-backup-${dateStr}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(payload, null, 2));

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Save Lilt Backup",
        UTI: "public.json",
      });
    }

    return { success: true, message: "Data exported successfully.", filePath };
  } catch (error) {
    return { success: false, message: "Export failed. Please try again." };
  }
}

export async function importData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const payload: BackupPayload = JSON.parse(jsonString);

    if (!payload.version || payload.version !== "1.0" || !payload.data) {
      return { success: false, message: "Invalid backup file format." };
    }

    const entries = STORAGE_KEYS.flatMap((key) => {
      const value = payload.data[key];
      return typeof value === "string" ? [[key, value] as [string, string]] : [];
    });

    await AsyncStorage.multiRemove([...STORAGE_KEYS]);
    await AsyncStorage.multiSet(entries);

    return { success: true, message: "Data restored successfully." };
  } catch {
    return { success: false, message: "Failed to restore data. The file may be corrupted." };
  }
}

export async function clearAllData(): Promise<{ success: boolean; message: string }> {
  try {
    await AsyncStorage.multiRemove([...STORAGE_KEYS]);
    return { success: true, message: "All data cleared." };
  } catch {
    return { success: false, message: "Failed to clear data. Please try again." };
  }
}
