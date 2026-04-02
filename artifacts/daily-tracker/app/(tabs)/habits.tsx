import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import { useHabits, type Habit, CATEGORY_COLORS, CATEGORY_ICONS } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function HabitsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, addHabit, removeHabit, updateHabit, getStreakForHabit } = useHabits();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleLongPress = (habit: Habit) => {
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
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>All Habits</Text>
          <Pressable
            onPress={() => { setEditingHabit(null); setSheetVisible(true); }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            hitSlop={8}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        {habits.length === 0 ? (
          <EmptyHabits />
        ) : (
          <View style={styles.list}>
            {habits.map((habit) => {
              const streak = getStreakForHabit(habit.id);
              return (
                <Pressable
                  key={habit.id}
                  onPress={() => { setEditingHabit(habit); setSheetVisible(true); }}
                  onLongPress={() => handleLongPress(habit)}
                  style={({ pressed }) => [
                    styles.habitRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.catIcon, { backgroundColor: habit.color + "20" }]}>
                    <Feather name={habit.icon as any} size={20} color={habit.color} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.habitName, { color: colors.foreground }]}>{habit.name}</Text>
                    <View style={styles.daysRow}>
                      {DAYS_SHORT.map((d, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dayDot,
                            {
                              backgroundColor: habit.targetDays.includes(i)
                                ? habit.color
                                : colors.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <View style={styles.streakBadge}>
                    <Feather name="zap" size={14} color="#f59e0b" />
                    <Text style={[styles.streakNum, { color: colors.foreground }]}>{streak}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    gap: 10,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 6,
  },
  habitName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  daysRow: {
    flexDirection: "row",
    gap: 4,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  streakNum: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
