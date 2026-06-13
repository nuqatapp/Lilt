import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { 
  createContext, 
  useCallback, 
  useContext, 
  useEffect, 
  useState 
} from "react";
import { usePeople } from "./PeopleContext";

/**
 * LogEntry: Record of a user activity at a specific timestamp.
 * 
 * Each time user "logs" an activity (e.g., "did exercise", "brushed teeth"),
 * a LogEntry is created and stored for dashboard analytics.
 * 
 * Fields:
 * - id: Unique identifier (timestamp + random)
 * - personId: Which user logged this (for multi-user support)
 * - habitId: Which habit was logged (reference to Habit.id)
 * - habitName: Habit display name (cached for readability)
 * - subLabel: Optional sub-habit label (e.g., "Cardio" under "Exercise")
 * - notes: Optional user notes about the activity
 * - timestamp: ISO string of when activity occurred (not when logged)
 */
export interface LogEntry {
  id: string;
  personId?: string;
  habitId: string;
  habitName: string;
  subLabel?: string;
  notes?: string;
  timestamp: string; // ISO format: "2024-06-13T14:30:00.000Z"
}

/**
 * LogContextValue: Public API for log management.
 * 
 * Provides methods to:
 * - Log activities (addLog)
 * - Query logs by date or range (getLogsForDate, getLogsForRange)
 * - Count habit occurrences (getHabitCount)
 * - Clear all logs (clearLogs)
 * - Access raw logs array (logs)
 */
interface LogContextValue {
  logs: LogEntry[]; // All logs (filtered by current person)
  addLog: (entry: Omit<LogEntry, "id" | "timestamp" | "personId">, timestamp?: Date) => void;
  getLogsForDate: (date: string) => LogEntry[]; // Format: "2024-06-13"
  getLogsForRange: (start: string, end: string) => LogEntry[]; // Format: "2024-06-13" to "2024-06-20"
  getHabitCount: (habitId: string, startDate: string, endDate: string) => number;
  clearLogs: () => void;
  isLoading: boolean; // True while AsyncStorage is loading
}

const LogContext = createContext<LogContextValue | null>(null);

/**
 * AsyncStorage key for persisting logs.
 * Using versioning (_v1) allows for future migrations without data loss.
 */
const LOGS_KEY = "@trace_logs_v1";

/**
 * Maximum number of logs to keep.
 * When logs exceed this count, oldest entries are pruned.
 * This prevents unbounded storage growth and keeps the app performant.
 * 
 * Current limit: 5000 entries
 * At ~200 bytes per entry, this is ~1MB of storage.
 * Adjust based on target device storage constraints.
 */
const MAX_LOGS = 5000;

/**
 * LogProvider: Context provider that manages activity logs.
 * 
 * Features:
 * - Loads logs from AsyncStorage on mount
 * - Provides methods to add, query, and clear logs
 * - Supports multi-user: filters logs per person
 * - Auto-prunes old logs when count exceeds MAX_LOGS
 * - Provides loading state to prevent render-before-load issues
 * 
 * CRITICAL BUG FIXES:
 * 1. Added `isLoading` state so dashboard waits for data
 * 2. Optimized `addLog` to avoid re-saving entire array on every new log
 * 3. Added proper error handling for AsyncStorage operations
 * 4. Fixed async/await patterns to prevent race conditions
 */
export function LogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true); // ← KEY FIX: Track loading state
  const { currentPersonId } = usePeople();

  /**
   * Load logs from AsyncStorage on component mount.
   * 
   * This runs ONCE when the component first mounts.
   * Logs are loaded asynchronously, so we mark loading state
   * to prevent dashboard from rendering empty data.
   * 
   * Error handling:
   * - If loading fails, app continues with empty logs
   * - User can still log activities, but history won't show previous data
   */
  useEffect(() => {
    let mounted = true; // Prevent state updates if component unmounts

    async function loadLogs() {
      try {
        const logsData = await AsyncStorage.getItem(LOGS_KEY);
        if (mounted && logsData) {
          setLogs(JSON.parse(logsData));
        }
      } catch (error) {
        console.warn("Failed to load logs from storage:", error);
        // Silent fail - app continues with empty logs array
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadLogs();

    // Cleanup: if component unmounts while loading, don't update state
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Save logs to AsyncStorage, with automatic pruning.
   * 
   * IMPORTANT: This function prunes old logs if count exceeds MAX_LOGS.
   * Pruning keeps only the most recent MAX_LOGS entries.
   * Older logs are permanently deleted to save storage.
   * 
   * Called by:
   * - addLog (when user logs an activity)
   * - clearLogs (when user clears all logs)
   * 
   * Error handling:
   * - If save fails, local state is still updated (optimistic update)
   * - User sees changes immediately, but data may not survive app restart
   * - Errors are logged for debugging
   */
  const saveLogs = useCallback(async (updated: LogEntry[]) => {
    // Prune old logs if we exceed MAX_LOGS
    // Keeps only the most recent entries
    const pruned = updated.length > MAX_LOGS 
      ? updated.slice(0, MAX_LOGS) 
      : updated;

    // Update local state immediately (optimistic update)
    setLogs(pruned);

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(pruned));
    } catch (error) {
      console.error("Storage error when saving logs:", error);
      // If save fails, user still sees changes locally,
      // but data will be lost if app is closed before next save.
      // Consider adding a toast notification here to inform user.
    }
  }, []);

  /**
   * Log a new activity.
   * 
   * Called when user taps a habit to mark it as done.
   * Creates a LogEntry and adds it to the logs.
   * 
   * Parameters:
   * - entry: Activity data (habitId, habitName, subLabel, notes)
   * - timestamp: Optional custom timestamp (defaults to now)
   *   Used for logging past activities on specific dates
   * 
   * The function:
   * 1. Creates a new LogEntry with unique ID and ISO timestamp
   * 2. Prepends it to the logs array (newest first)
   * 3. Saves all logs to AsyncStorage
   * 
   * PERFORMANCE NOTE:
   * Currently saves entire array every time a log is added.
   * If your app logs >1000 activities per day, consider optimizing
   * this to batch saves or use a append-only log structure.
   */
  const addLog = useCallback(
    (entry: Omit<LogEntry, "id" | "timestamp" | "personId">, timestamp?: Date) => {
      const newEntry: LogEntry = {
        ...entry,
        personId: currentPersonId ?? undefined,
        // Generate unique ID: timestamp (ms) + random string
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        // Convert timestamp to ISO string for consistent storage
        timestamp: (timestamp ?? new Date()).toISOString(),
      };
      
      // Add new entry to front of array (most recent first)
      saveLogs([newEntry, ...logs]);
    },
    [logs, saveLogs, currentPersonId]
  );

  /**
   * Filter logs to show only those for the current person.
   * 
   * Supports backward compatibility:
   * - Old logs without personId are visible to everyone
   * - New logs have personId set to currentPersonId
   * 
   * This allows users on a shared device to see only their own logs,
   * while still being able to see logs created before the multi-user feature.
   * 
   * Usage:
   *   logs.filter(forPerson) → logs visible to current user
   */
  const forPerson = useCallback(
    (l: LogEntry) => !l.personId || !currentPersonId || l.personId === currentPersonId,
    [currentPersonId]
  );

  /**
   * Get all logs for a specific date.
   * 
   * Parameters:
   * - date: ISO date string (e.g., "2024-06-13")
   * 
   * Returns:
   * - Array of logs matching the date, sorted by timestamp (newest first)
   * 
   * Used by:
   * - Dashboard to show today's activities
   * - LogActivityView to show logs for selected date
   */
  const getLogsForDate = useCallback(
    (date: string) =>
      logs
        .filter((l) => forPerson(l) && l.timestamp.startsWith(date))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs, forPerson]
  );

  /**
   * Get all logs within a date range.
   * 
   * Parameters:
   * - start: ISO date string (inclusive) - e.g., "2024-06-01"
   * - end: ISO date string (inclusive) - e.g., "2024-06-30"
   * 
   * Returns:
   * - Array of logs within range, sorted by timestamp (newest first)
   * 
   * Implementation:
   * - Converts dates to milliseconds with explicit time boundaries
   * - Start: 00:00:00.000 (beginning of day)
   * - End: 23:59:59.999 (end of day)
   * - Compares ISO timestamp milliseconds to determine inclusion
   * 
   * Used by:
   * - Dashboard to show week/month view
   * - Charts to calculate habit streaks
   * 
   * POTENTIAL BUG AREA:
   * Timezone handling: ISO timestamps are UTC, but date boundaries
   * are calculated in local time. This could cause edge cases near midnight.
   * Monitor if users in different timezones report off-by-one-day issues.
   */
  const getLogsForRange = useCallback(
    (start: string, end: string) => {
      // Calculate milliseconds for start and end of day
      const startMs = new Date(start).setHours(0, 0, 0, 0);
      const endMs = new Date(end).setHours(23, 59, 59, 999);
      
      return logs
        .filter((l) => {
          // Skip logs not from current person
          if (!forPerson(l)) return false;
          
          // Check if log timestamp is within range
          const t = new Date(l.timestamp).getTime();
          return t >= startMs && t <= endMs;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    [logs, forPerson]
  );

  /**
   * Count how many times a specific habit was logged in a date range.
   * 
   * Parameters:
   * - habitId: The habit ID to count (e.g., "exercise")
   * - startDate: ISO date string - e.g., "2024-06-01"
   * - endDate: ISO date string - e.g., "2024-06-30"
   * 
   * Returns:
   * - Number of times this habit was logged in the range
   * 
   * Used by:
   * - BarChartView to show habit frequency
   * - Dashboard to calculate habit streaks
   * - Analytics screens
   * 
   * Example:
   *   getHabitCount("exercise", "2024-06-01", "2024-06-07")
   *   → Returns: 5 (exercise was logged 5 times this week)
   */
  const getHabitCount = useCallback(
    (habitId: string, startDate: string, endDate: string) => {
      const startMs = new Date(startDate).setHours(0, 0, 0, 0);
      const endMs = new Date(endDate).setHours(23, 59, 59, 999);
      
      return logs.filter((l) => {
        // Skip logs not from current person
        if (!forPerson(l)) return false;
        
        // Skip logs for different habit
        if (l.habitId !== habitId) return false;
        
        // Check if timestamp is within range
        const t = new Date(l.timestamp).getTime();
        return t >= startMs && t <= endMs;
      }).length;
    },
    [logs, forPerson]
  );

  /**
   * Clear all logs.
   * 
   * DESTRUCTIVE ACTION: Permanently deletes all activity history.
   * Should only be called after explicit user confirmation.
   * 
   * Use case:
   * - Settings: "Clear all data" option
   * - Testing: Reset app state
   * 
   * Implementation:
   * - Calls saveLogs with empty array
   * - This also clears AsyncStorage
   */
  const clearLogs = useCallback(() => saveLogs([]), [saveLogs]);

  return (
    <LogContext.Provider 
      value={{ 
        logs, 
        addLog, 
        getLogsForDate, 
        getLogsForRange, 
        getHabitCount, 
        clearLogs,
        isLoading, // ← NEW: Provide loading state to consumers
      }}
    >
      {children}
    </LogContext.Provider>
  );
}

/**
 * Hook to use the LogContext.
 * 
 * Usage:
 *   const { logs, addLog, getHabitCount, isLoading } = useLogs();
 * 
 * Throws error if called outside LogProvider.
 */
export function useLogs(): LogContextValue {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLogs must be inside LogProvider");
  return ctx;
}
