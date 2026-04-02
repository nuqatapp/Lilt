import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddHabitSheet } from "@/components/AddHabitSheet";
import { EmptyHabits } from "@/components/EmptyHabits";
import { HabitCard } from "@/components/HabitCard";
import { ProgressRing } from "@/components/ProgressRing";
import { WeekStrip } from "@/components/WeekStrip";
import { useHabits, type Habit } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    habits,
    addHabit,
    removeHabit,
    updateHabit,
    toggleCompletion,
    isCompleted,
    getStreakForHabit,
    getCompletionsForDate,
    getHabitsForDate,
  } = useHabits();

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const habitsForDate = useMemo(
    () => getHabitsForDate(selectedDate),
    [getHabitsForDate, selectedDate, habits]
  );

  const completionRate = useMemo(() => {
    if (habitsForDate.length === 0) return 0;
    const done = habitsForDate.filter((h) => isCompleted(h.id, selectedDate)).length;
    return done / habitsForDate.length;
  }, [habitsForDate, isCompleted, selectedDate]);

  const completedCount = useMemo(
    () => habitsForDate.filter((h) => isCompleted(h.id, selectedDate)).length,
    [habitsForDate, isCompleted, selectedDate]
  );

  const completionByDate = useMemo(() => {
    const today = new Date();
    const result: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayHabits = getHabitsForDate(dateStr);
      if (dayHabits.length > 0) {
        const done = dayHabits.filter((h) => isCompleted(h.id, dateStr)).length;
        result[dateStr] = done / dayHabits.length;
      }
    }
    return result;
  }, [getHabitsForDate, isCompleted, habits]);

  const isToday = selectedDate === today;
  const dateLabel = isToday
    ? "Today"
    : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

  const handleLongPress = useCallback(
    (habit: Habit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(habit.name, undefined, [
        { text: "Edit", onPress: () => { setEditingHabit(habit); setSheetVisible(true); } },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            removeHabit(habit.id);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [removeHabit]
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {isToday ? getGreeting() : "Past"}
            </Text>
            <Text style={[styles.dateTitle, { color: colors.foreground }]}>{dateLabel}</Text>
          </View>
          <Pressable
            onPress={() => { setEditingHabit(null); setSheetVisible(true); }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            hitSlop={8}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        {habits.length > 0 && (
          <View style={styles.progressSection}>
            <ProgressRing
              progress={completionRate}
              size={110}
              strokeWidth={8}
              label={`${Math.round(completionRate * 100)}%`}
              sublabel={completedCount === habitsForDate.length && habitsForDate.length > 0 ? "Done!" : "done"}
            />
            <View style={styles.progressStats}>
              <StatPill label="Completed" value={`${completedCount}`} color={colors.primary} />
              <StatPill label="Remaining" value={`${habitsForDate.length - completedCount}`} color={colors.mutedForeground} />
              <StatPill label="Total" value={`${habitsForDate.length}`} color={colors.foreground} />
            </View>
          </View>
        )}

        <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <WeekStrip
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            completionByDate={completionByDate}
          />
        </View>

        {habitsForDate.length === 0 ? (
          <EmptyHabits
            message={
              habits.length === 0
                ? "Tap + to add your first habit"
                : "No habits scheduled for this day"
            }
          />
        ) : (
          <View style={styles.habitsList}>
            {habitsForDate.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={isCompleted(habit.id, selectedDate)}
                streak={getStreakForHabit(habit.id)}
                onToggle={() => toggleCompletion(habit.id, selectedDate)}
                onLongPress={() => handleLongPress(habit)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddHabitSheet
        visible={sheetVisible}
        onClose={() => { setSheetVisible(false); setEditingHabit(null); }}
        onAdd={addHabit}
        editHabit={editingHabit}
        onUpdate={updateHabit}
      />
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statPill, { backgroundColor: colors.muted }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  dateTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  progressStats: {
    flex: 1,
    gap: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  weekCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  habitsList: {
    gap: 2,
  },
});
