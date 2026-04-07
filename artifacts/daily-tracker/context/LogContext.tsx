import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePeople } from "./PeopleContext";

export interface LogEntry {
  id: string;
  personId?: string;
  habitId: string;
  habitName: string;
  subLabel?: string;
  notes?: string;
  timestamp: string;
}

interface LogContextValue {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, "id" | "timestamp" | "personId">, timestamp?: Date) => void;
  getLogsForDate: (date: string) => LogEntry[];
  getLogsForRange: (start: string, end: string) => LogEntry[];
  getHabitCount: (habitId: string, startDate: string, endDate: string) => number;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextValue | null>(null);
const LOGS_KEY = "@trace_logs_v1";
const MAX_LOGS = 5000;

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { currentPersonId } = usePeople();

  useEffect(() => {
    AsyncStorage.getItem(LOGS_KEY)
      .then((v) => { if (v) setLogs(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const saveLogs = useCallback(async (updated: LogEntry[]) => {
    const pruned = updated.length > MAX_LOGS ? updated.slice(0, MAX_LOGS) : updated;
    setLogs(pruned);
    try {
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(pruned));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, []);

  const addLog = useCallback(
    (entry: Omit<LogEntry, "id" | "timestamp" | "personId">, timestamp?: Date) => {
      const newEntry: LogEntry = {
        ...entry,
        personId: currentPersonId ?? undefined,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        timestamp: (timestamp ?? new Date()).toISOString(),
      };
      saveLogs([newEntry, ...logs]);
    },
    [logs, saveLogs, currentPersonId]
  );

  // Backward-compat: old entries without personId are visible to everyone
  const forPerson = useCallback(
    (l: LogEntry) => !l.personId || !currentPersonId || l.personId === currentPersonId,
    [currentPersonId]
  );

  const getLogsForDate = useCallback(
    (date: string) =>
      logs
        .filter((l) => forPerson(l) && l.timestamp.startsWith(date))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs, forPerson]
  );

  const getLogsForRange = useCallback(
    (start: string, end: string) => {
      const startMs = new Date(start).setHours(0, 0, 0, 0);
      const endMs = new Date(end).setHours(23, 59, 59, 999);
      return logs
        .filter((l) => {
          if (!forPerson(l)) return false;
          const t = new Date(l.timestamp).getTime();
          return t >= startMs && t <= endMs;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    [logs, forPerson]
  );

  const getHabitCount = useCallback(
    (habitId: string, startDate: string, endDate: string) => {
      const startMs = new Date(startDate).setHours(0, 0, 0, 0);
      const endMs = new Date(endDate).setHours(23, 59, 59, 999);
      return logs.filter((l) => {
        if (!forPerson(l) || l.habitId !== habitId) return false;
        const t = new Date(l.timestamp).getTime();
        return t >= startMs && t <= endMs;
      }).length;
    },
    [logs, forPerson]
  );

  const clearLogs = useCallback(() => saveLogs([]), [saveLogs]);

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
