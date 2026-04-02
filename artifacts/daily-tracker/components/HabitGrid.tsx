import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Habit, SubHabit } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const COLS = 4;
const CELL_SIZE = (width - 32 - (COLS - 1) * 8) / COLS;

interface HabitGridProps {
  habits: Habit[];
  onLog: (habit: Habit, subHabit?: SubHabit) => void;
}

interface PopupState {
  habit: Habit;
  x: number;
  y: number;
}

export function HabitGrid({ habits, onLog }: HabitGridProps) {
  const colors = useColors();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const cellRefs = useRef<Record<string, View | null>>({});

  const handlePress = useCallback(
    (habit: Habit) => {
      if (habit.subHabits.length === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onLog(habit);
      }
    },
    [onLog]
  );

  const handleLongPress = useCallback(
    (habit: Habit) => {
      if (habit.subHabits.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const ref = cellRefs.current[habit.id];
        if (ref) {
          ref.measure((_fx, _fy, _w, _h, px, py) => {
            setPopup({ habit, x: px, y: py });
          });
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onLog(habit);
      }
    },
    [onLog]
  );

  const handleSubLog = useCallback(
    (sub: SubHabit) => {
      if (!popup) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLog(popup.habit, sub);
      setPopup(null);
    },
    [popup, onLog]
  );

  return (
    <View style={styles.grid}>
      {habits.map((habit) => (
        <View
          key={habit.id}
          ref={(r) => { cellRefs.current[habit.id] = r; }}
          style={[styles.cellWrap, { width: CELL_SIZE }]}
        >
          <Pressable
            onPress={() => handlePress(habit)}
            onLongPress={() => handleLongPress(habit)}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: habit.color + "22" }]}>
              <MaterialCommunityIcons
                name={habit.icon as any}
                size={28}
                color={habit.color}
              />
            </View>
            <Text style={[styles.cellLabel, { color: colors.foreground }]} numberOfLines={1}>
              {habit.name}
            </Text>
            {habit.subHabits.length > 0 && (
              <Text style={[styles.longPressHint, { color: colors.mutedForeground }]}>
                long-press
              </Text>
            )}
          </Pressable>
        </View>
      ))}

      {popup && (
        <Modal transparent animationType="fade" onRequestClose={() => setPopup(null)}>
          <Pressable style={styles.overlay} onPress={() => setPopup(null)}>
            <View
              style={[
                styles.popupCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  left: Math.max(8, Math.min(popup.x - 20, width - 200)),
                  top: Math.max(60, popup.y - 20),
                },
              ]}
            >
              <Text style={[styles.popupTitle, { color: colors.mutedForeground }]}>
                long-press
              </Text>
              <View style={styles.subRow}>
                {popup.habit.subHabits.map((sub) => (
                  <Pressable
                    key={sub.id}
                    onPress={() => handleSubLog(sub)}
                    style={styles.subItem}
                  >
                    <View
                      style={[styles.subIconWrap, { backgroundColor: sub.color + "28" }]}
                    >
                      <MaterialCommunityIcons
                        name={sub.icon as any}
                        size={22}
                        color={sub.color}
                      />
                    </View>
                    <Text style={[styles.subLabel, { color: colors.foreground }]}>
                      {sub.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  cellWrap: {
    alignItems: "center",
  },
  cell: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    gap: 4,
    minHeight: 80,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cellLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  longPressHint: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  popupCard: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    minWidth: 180,
    maxWidth: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  popupTitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  subRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  subItem: {
    alignItems: "center",
    gap: 4,
    width: 58,
  },
  subIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  subLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
