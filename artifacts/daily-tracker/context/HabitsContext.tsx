import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SubHabit {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  iconSet: "MaterialCommunityIcons" | "Ionicons";
  color: string;
  subHabits: SubHabit[];
  isCustom?: boolean;
}

interface HabitsContextValue {
  habits: Habit[];
  addCustomHabit: (name: string, icon: string, color: string) => void;
  removeHabit: (id: string) => void;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);
const CUSTOM_KEY = "@trace_custom_habits_v1";

const DEFAULT_HABITS: Habit[] = [
  {
    id: "shower",
    name: "Shower",
    icon: "shower",
    iconSet: "MaterialCommunityIcons",
    color: "#7ab8c4",
    subHabits: [],
  },
  {
    id: "exercise",
    name: "Exercise",
    icon: "run",
    iconSet: "MaterialCommunityIcons",
    color: "#8aaa70",
    subHabits: [
      { id: "cardio", label: "Cardio", icon: "heart-pulse", color: "#c97070" },
      { id: "strength", label: "Strength", icon: "weight-lifter", color: "#8aaa70" },
      { id: "yoga", label: "Yoga", icon: "yoga", color: "#b07ab0" },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    icon: "toilet",
    iconSet: "MaterialCommunityIcons",
    color: "#a0b8c8",
    subHabits: [],
  },
  {
    id: "eating",
    name: "Eating",
    icon: "silverware-fork-knife",
    iconSet: "MaterialCommunityIcons",
    color: "#c8a060",
    subHabits: [
      { id: "breakfast", label: "Breakfast", icon: "coffee", color: "#c8a060" },
      { id: "main_meal", label: "Main Meal", icon: "food", color: "#c87060" },
      { id: "sugar", label: "Sugar", icon: "candy", color: "#c870a0" },
      { id: "hydration", label: "Hydration", icon: "water", color: "#7098c8" },
    ],
  },
  {
    id: "walking",
    name: "Walking",
    icon: "walk",
    iconSet: "MaterialCommunityIcons",
    color: "#a09070",
    subHabits: [
      { id: "heavy", label: "Heavy", icon: "shoe-print", color: "#a09070" },
      { id: "light", label: "Light", icon: "footprint", color: "#c0b090" },
      { id: "cardio_walk", label: "Cardio", icon: "heart-flash", color: "#c07070" },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    icon: "broom",
    iconSet: "MaterialCommunityIcons",
    color: "#90b8a0",
    subHabits: [],
  },
  {
    id: "sleeping",
    name: "Sleeping",
    icon: "sleep",
    iconSet: "MaterialCommunityIcons",
    color: "#9090c0",
    subHabits: [],
  },
  {
    id: "reading",
    name: "Reading",
    icon: "book-open-variant",
    iconSet: "MaterialCommunityIcons",
    color: "#c09060",
    subHabits: [],
  },
  {
    id: "work",
    name: "Work",
    icon: "laptop",
    iconSet: "MaterialCommunityIcons",
    color: "#7090a8",
    subHabits: [],
  },
  {
    id: "stretching",
    name: "Stretching",
    icon: "human-handsup",
    iconSet: "MaterialCommunityIcons",
    color: "#b09880",
    subHabits: [],
  },
];

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [customHabits, setCustomHabits] = useState<Habit[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_KEY)
      .then((v) => { if (v) setCustomHabits(JSON.parse(v)); })
      .catch(() => {});
  }, []);

  const save = useCallback(async (h: Habit[]) => {
    setCustomHabits(h);
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(h));
  }, []);

  const addCustomHabit = useCallback(
    (name: string, icon: string, color: string) => {
      const newH: Habit = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name,
        icon,
        iconSet: "MaterialCommunityIcons",
        color,
        subHabits: [],
        isCustom: true,
      };
      save([...customHabits, newH]);
    },
    [customHabits, save]
  );

  const removeHabit = useCallback(
    (id: string) => save(customHabits.filter((h) => h.id !== id)),
    [customHabits, save]
  );

  const habits = [...DEFAULT_HABITS, ...customHabits];

  return (
    <HabitsContext.Provider value={{ habits, addCustomHabit, removeHabit }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be inside HabitsProvider");
  return ctx;
}
