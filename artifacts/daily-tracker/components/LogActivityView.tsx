import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export function LogActivityView() {
  const colors = useColors();
  const { habits, addCustomHabit } = useHabits();
  const { addLog } = useLogs();
  const [notes, setNotes] = useState("");
  const [lastLogged, setLastLogged] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleLog = useCallback(
    (habit: Habit, subHabit?: SubHabit) => {
      addLog({
        habitId: habit.id,
        habitName: habit.name,
        subLabel: subHabit?.label,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      setLastLogged(new Date());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [addLog, notes]
  );

  const handleAddCustom = useCallback((name: string) => {
    addCustomHabit(name);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addCustomHabit]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <HabitGrid habits={habits} onLog={handleLog} />

      <View style={styles.notesSection}>
        <Text style={[styles.notesLabel, { color: colors.foreground }]}>
          Notes / Free Text
        </Text>
        <View style={[styles.notesRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add extra details..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.notesInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            multiline={false}
            returnKeyType="done"
          />
          <Pressable
            onPress={() => {
              if (notes.trim()) {
                addLog({
                  habitId: "free_text",
                  habitName: "Free Text",
                  notes: notes.trim(),
                });
                setNotes("");
                setLastLogged(new Date());
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
            style={[styles.logBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.logBtnText, { color: colors.primary }]}>Log</Text>
          </Pressable>
        </View>
      </View>

      {lastLogged && (
        <Text style={[styles.loggedAt, { color: colors.mutedForeground }]}>
          Log at: {formatLogTime(lastLogged)}
        </Text>
      )}

      <Pressable onPress={() => setShowAddModal(true)} style={styles.addCustom}>
        <MaterialCommunityIcons name="plus-circle-outline" size={16} color={colors.primary} />
        <Text style={[styles.addCustomText, { color: colors.primary }]}>Add Custom Habit</Text>
      </Pressable>

      <AddCustomHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustom}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 12,
  },
  notesSection: {
    paddingHorizontal: 16,
    gap: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  notesRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  notesInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  logBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderLeftWidth: 1,
  },
  logBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  loggedAt: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
  },
  addCustom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  addCustomText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
