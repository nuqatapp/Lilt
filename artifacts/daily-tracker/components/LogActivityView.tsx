import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Habit, SubHabit } from "@/context/HabitsContext";
import { useHabits } from "@/context/HabitsContext";
import { useLogs } from "@/context/LogContext";
import { useColors } from "@/hooks/useColors";
import { AddCustomHabitModal } from "@/components/AddCustomHabitModal";
import { HabitGrid } from "@/components/HabitGrid";

function formatLogTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${h}:${m} ${ampm}, ${months[d.getMonth()]} ${d.getDate()}`;
}

interface LogActivityViewProps {
  personName?: string;
}

export function LogActivityView({ personName }: LogActivityViewProps) {
  const colors = useColors();
  const { habits, favoriteIds, toggleFavorite, addCustomHabit, removeHabit } = useHabits();
  const { addLog } = useLogs();
  const [lastLogged, setLastLogged] = useState<Date | null>(null);
  const [lastLabel, setLastLabel] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);

  const handleLog = useCallback(
    (habit: Habit, subHabit?: SubHabit, notes?: string) => {
      addLog({
        habitId: habit.id,
        habitName: habit.name,
        subLabel: subHabit?.label,
        notes: notes || undefined,
      });
      setLastLogged(new Date());
      setLastLabel(subHabit ? `${habit.name} · ${subHabit.label}` : habit.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [addLog]
  );

  const handleAddCustom = useCallback((name: string, icon: string, color: string) => {
    addCustomHabit(name, icon, color);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addCustomHabit]);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HabitGrid
          habits={habits}
          favoriteIds={favoriteIds}
          onLog={handleLog}
          onDelete={removeHabit}
          onToggleFavorite={toggleFavorite}
        />

        {lastLogged && (
          <View style={[styles.loggedBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <MaterialCommunityIcons name="check-circle" size={15} color={colors.primary} />
            <Text style={[styles.loggedText, { color: colors.primary }]}>
              Logged <Text style={{ fontFamily: "Inter_600SemiBold" }}>{lastLabel}</Text>
              {personName ? ` for ${personName}` : ""}
              {" · "}{formatLogTime(lastLogged)}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => setShowAddModal(true)}
          style={[styles.addCustomBtn, { borderColor: colors.primary + "50", backgroundColor: colors.primary + "10" }]}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.addCustomText, { color: colors.primary }]}>Add Custom Habit</Text>
        </Pressable>
      </ScrollView>

      <AddCustomHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustom}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 12,
  },
  loggedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  loggedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  addCustomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    marginHorizontal: 16,
  },
  addCustomText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
