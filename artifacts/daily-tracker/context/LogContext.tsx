import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface LogEntry {
  id: string;
  habitId: string;
  habitName: string;
  subLabel?: string;
  notes?: string;
  timestamp: string;
}

interface LogContextValue {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  getLogsForDate: (date: string) => LogEntry[];
  getLogsForRange: (start: string, end: string) => LogEntry[];
  getHabitCount: (habitId: string, startDate: string, endDate: string) => number;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextValue | null>(null);
const LOGS_KEY = "@trace_logs_v1";

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(LOGS_KEY)
      .then((v) => { if (v) setLogs(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const saveLogs = useCallback(async (updated: LogEntry[]) => {
    setLogs(updated);
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  }, []);

  const addLog = useCallback(
    (entry: Omit<LogEntry, "id" | "timestamp">) => {
      const newEntry: LogEntry = {
        ...entry,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      };
      saveLogs([newEntry, ...logs]);
    },
    [logs, saveLogs]
  );

  const getLogsForDate = useCallback(
    (date: string) =>
      logs.filter((l) => l.timestamp.startsWith(date)).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [logs]
  );

  const getLogsForRange = useCallback(
    (start: string, end: string) =>
      logs.filter((l) => l.timestamp >= start && l.timestamp <= end + "T23:59:59"),
    [logs]
  );

  const getHabitCount = useCallback(
    (habitId: string, startDate: string, endDate: string) =>
      logs.filter(
        (l) =>
          l.habitId === habitId &&
          l.timestamp >= startDate &&
          l.timestamp <= endDate + "T23:59:59"
      ).length,
    [logs]
  );

  const clearLogs = useCallback(() => {
    saveLogs([]);
  }, [saveLogs]);

  return (
    <LogContext.Provider value={{ logs, addLog, getLogsForDate, getLogsForRange, getHabitCount, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs(): LogContextValue {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLogs must be inside LogProvider");
  return ctx;
}
