import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface Person {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface PeopleContextValue {
  people: Person[];
  loaded: boolean;
  currentPersonId: string | null;
  currentPerson: Person | undefined;
  setCurrentPersonId: (id: string | null) => void;
  addPerson: (name: string, color: string) => Person;
  updatePerson: (id: string, name: string, color: string) => void;
  removePerson: (id: string) => void;
}

const PeopleContext = createContext<PeopleContextValue | null>(null);
const PEOPLE_KEY = "@lilt_people_v1";

export const PERSON_COLORS = [
  "#8fa3c2", "#c8a0ae", "#8aaf98", "#c0a870",
  "#a8a0c8", "#a8927a", "#88a878", "#b09870",
  "#7fa8d8", "#b0a4c8", "#9abf8a", "#c49070",
];

function makeId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentPersonId, setCurrentPersonId] = useState<string | null>(null);

  const currentPerson = people.find((p) => p.id === currentPersonId);

  useEffect(() => {
    AsyncStorage.getItem(PEOPLE_KEY)
      .then((v) => { if (v) setPeople(JSON.parse(v)); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback(async (updated: Person[]) => {
    setPeople(updated);
    await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(updated));
  }, []);

  const addPerson = useCallback((name: string, color: string): Person => {
    const newP: Person = { id: makeId(), name: name.trim(), color, createdAt: new Date().toISOString() };
    save([...people, newP]);
    return newP;
  }, [people, save]);

  const updatePerson = useCallback((id: string, name: string, color: string) => {
    save(people.map((p) => p.id === id ? { ...p, name: name.trim(), color } : p));
  }, [people, save]);

  const removePerson = useCallback((id: string) => {
    save(people.filter((p) => p.id !== id));
    setCurrentPersonId((prev) => prev === id ? null : prev);
  }, [people, save]);

  return (
    <PeopleContext.Provider value={{
      people, loaded, currentPersonId, currentPerson,
      setCurrentPersonId, addPerson, updatePerson, removePerson,
    }}>
      {children}
    </PeopleContext.Provider>
  );
}

export function usePeople(): PeopleContextValue {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error("usePeople must be inside PeopleProvider");
  return ctx;
}
