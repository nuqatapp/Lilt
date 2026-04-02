import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type HabitCategory =
  | "health"
  | "fitness"
  | "mindfulness"
  | "learning"
  | "productivity"
  | "social"
  | "other";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;
  color: string;
  createdAt: string;
  targetDays: number[];
}

export interface HabitCompletion {
  habitId: string;
  date: string;
  completedAt: string;
}

interface HabitsContextValue {
  habits: Habit[];
  completions: HabitCompletion[];
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  removeHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Omit<Habit, "id" | "createdAt">>) => void;
  toggleCompletion: (habitId: string, date: string) => void;
  isCompleted: (habitId: string, date: string) => boolean;
  getStreakForHabit: (habitId: string) => number;
  getTodayCompletionRate: () => number;
  getCompletionsForDate: (date: string) => HabitCompletion[];
  getHabitsForDate: (date: string) => Habit[];
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

const HABITS_KEY = "@daily_tracker_habits";
const COMPLETIONS_KEY = "@daily_tracker_completions";

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: "#ef4444",
  fitness: "#f97316",
  mindfulness: "#8b5cf6",
  learning: "#3b82f6",
  productivity: "#0d9488",
  social: "#ec4899",
  other: "#6b7280",
};

export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  health: "heart",
  fitness: "activity",
  mindfulness: "sun",
  learning: "book",
  productivity: "check-square",
  social: "users",
  other: "star",
};

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function dayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const habitsJson = await AsyncStorage.getItem(HABITS_KEY);
        const completionsJson = await AsyncStorage.getItem(COMPLETIONS_KEY);
        if (habitsJson) setHabits(JSON.parse(habitsJson));
        if (completionsJson) setCompletions(JSON.parse(completionsJson));
      } catch (_) {}
    })();
  }, []);

  const saveHabits = useCallback(async (updated: Habit[]) => {
    setHabits(updated);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
  }, []);

  const saveCompletions = useCallback(async (updated: HabitCompletion[]) => {
    setCompletions(updated);
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(updated));
  }, []);

  const addHabit = useCallback(
    (habit: Omit<Habit, "id" | "createdAt">) => {
      const newHabit: Habit = {
        ...habit,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
      };
      saveHabits([...habits, newHabit]);
    },
    [habits, saveHabits]
  );

  const removeHabit = useCallback(
    (id: string) => {
      saveHabits(habits.filter((h) => h.id !== id));
      saveCompletions(completions.filter((c) => c.habitId !== id));
    },
    [habits, completions, saveHabits, saveCompletions]
  );

  const updateHabit = useCallback(
    (id: string, updates: Partial<Omit<Habit, "id" | "createdAt">>) => {
      saveHabits(habits.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    },
    [habits, saveHabits]
  );

  const toggleCompletion = useCallback(
    (habitId: string, date: string) => {
      const exists = completions.find(
        (c) => c.habitId === habitId && c.date === date
      );
      if (exists) {
        saveCompletions(
          completions.filter((c) => !(c.habitId === habitId && c.date === date))
        );
      } else {
        saveCompletions([
          ...completions,
          { habitId, date, completedAt: new Date().toISOString() },
        ]);
      }
    },
    [completions, saveCompletions]
  );

  const isCompleted = useCallback(
    (habitId: string, date: string) =>
      completions.some((c) => c.habitId === habitId && c.date === date),
    [completions]
  );

  const getStreakForHabit = useCallback(
    (habitId: string): number => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return 0;
      let streak = 0;
      const d = new Date();
      for (let i = 0; i < 365; i++) {
        const dateStr = d.toISOString().split("T")[0];
        const dow = dayOfWeek(dateStr);
        if (habit.targetDays.includes(dow)) {
          if (completions.some((c) => c.habitId === habitId && c.date === dateStr)) {
            streak++;
          } else if (dateStr !== todayString()) {
            break;
          }
        }
        d.setDate(d.getDate() - 1);
      }
      return streak;
    },
    [habits, completions]
  );

  const getTodayCompletionRate = useCallback((): number => {
    const today = todayString();
    const todayHabits = habits.filter((h) =>
      h.targetDays.includes(dayOfWeek(today))
    );
    if (todayHabits.length === 0) return 0;
    const done = todayHabits.filter((h) => isCompleted(h.id, today)).length;
    return done / todayHabits.length;
  }, [habits, isCompleted]);

  const getCompletionsForDate = useCallback(
    (date: string) => completions.filter((c) => c.date === date),
    [completions]
  );

  const getHabitsForDate = useCallback(
    (date: string) => {
      const dow = dayOfWeek(date);
      return habits.filter((h) => h.targetDays.includes(dow));
    },
    [habits]
  );

  return (
    <HabitsContext.Provider
      value={{
        habits,
        completions,
        addHabit,
        removeHabit,
        updateHabit,
        toggleCompletion,
        isCompleted,
        getStreakForHabit,
        getTodayCompletionRate,
        getCompletionsForDate,
        getHabitsForDate,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used inside HabitsProvider");
  return ctx;
}
