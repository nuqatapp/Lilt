import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Habit, HabitCategory } from "@/context/HabitsContext";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: HabitCategory[] = [
  "health",
  "fitness",
  "mindfulness",
  "learning",
  "productivity",
  "social",
  "other",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface AddHabitSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, "id" | "createdAt">) => void;
  editHabit?: Habit | null;
  onUpdate?: (id: string, updates: Partial<Omit<Habit, "id" | "createdAt">>) => void;
}

export function AddHabitSheet({
  visible,
  onClose,
  onAdd,
  editHabit,
  onUpdate,
}: AddHabitSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(editHabit?.name ?? "");
  const [category, setCategory] = useState<HabitCategory>(editHabit?.category ?? "health");
  const [targetDays, setTargetDays] = useState<number[]>(
    editHabit?.targetDays ?? [0, 1, 2, 3, 4, 5, 6]
  );

  React.useEffect(() => {
    if (visible) {
      setName(editHabit?.name ?? "");
      setCategory(editHabit?.category ?? "health");
      setTargetDays(editHabit?.targetDays ?? [0, 1, 2, 3, 4, 5, 6]);
    }
  }, [visible, editHabit]);

  const toggleDay = useCallback((day: number) => {
    Haptics.selectionAsync();
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    const habitData = {
      name: name.trim(),
      category,
      icon: CATEGORY_ICONS[category],
      color: CATEGORY_COLORS[category],
      targetDays: targetDays.sort((a, b) => a - b),
    };
    if (editHabit && onUpdate) {
      onUpdate(editHabit.id, habitData);
    } else {
      onAdd(habitData);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }, [name, category, targetDays, editHabit, onUpdate, onAdd, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {editHabit ? "Edit Habit" : "New Habit"}
          </Text>
          <Pressable onPress={handleSave} hitSlop={8}>
            <Text
              style={[
                styles.save,
                {
                  color: name.trim() ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              {editHabit ? "Update" : "Add"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Habit name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              autoFocus
              returnKeyType="done"
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = cat === category;
              const catColor = CATEGORY_COLORS[cat];
              const catIcon = CATEGORY_ICONS[cat];
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat);
                  }}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isSelected ? catColor + "20" : colors.card,
                      borderColor: isSelected ? catColor : colors.border,
                    },
                  ]}
                >
                  <Feather name={catIcon as any} size={16} color={isSelected ? catColor : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.catLabel,
                      { color: isSelected ? catColor : colors.mutedForeground },
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Repeat</Text>
          <View style={[styles.daysCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.daysRow}>
              {DAYS.map((label, idx) => {
                const active = targetDays.includes(idx);
                return (
                  <Pressable
                    key={idx}
                    onPress={() => toggleDay(idx)}
                    style={[
                      styles.dayBtn,
                      {
                        backgroundColor: active ? colors.primary : "transparent",
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: active ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setTargetDays(
                  targetDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]
                );
              }}
              style={styles.everyDay}
            >
              <Text style={[styles.everyDayText, { color: colors.primary }]}>
                {targetDays.length === 7 ? "Deselect all" : "Every day"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  save: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 8,
  },
  inputCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    paddingVertical: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  catLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  daysCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  everyDay: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  everyDayText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
