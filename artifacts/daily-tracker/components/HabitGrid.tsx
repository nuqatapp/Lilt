import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
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

const GROUPS: Habit["group"][] = ["Body", "Productivity", "Home", "Lifestyle"];

const GROUP_ICONS: Record<Habit["group"], string> = {
  Body: "arm-flex-outline",
  Productivity: "briefcase-outline",
  Home: "home-outline",
  Lifestyle: "heart-outline",
};

interface HabitGridProps {
  habits: Habit[];
  onLog: (habit: Habit, subHabit?: SubHabit) => void;
  onDelete?: (id: string) => void;
}

interface PopupState {
  habit: Habit;
  x: number;
  y: number;
  mode: "subHabits" | "delete";
}

const DOUBLE_TAP_MS = 300;

export function HabitGrid({ habits, onLog, onDelete }: HabitGridProps) {
  const colors = useColors();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const cellRefs = useRef<Record<string, View | null>>({});
  const lastTap = useRef<Record<string, number>>({});

  const handlePress = useCallback(
    (habit: Habit) => {
      const now = Date.now();
      const last = lastTap.current[habit.id] ?? 0;
      if (now - last < DOUBLE_TAP_MS) {
        lastTap.current[habit.id] = 0;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLog(habit);
      } else {
        lastTap.current[habit.id] = now;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFlash(habit.id);
        setTimeout(() => setFlash((f) => (f === habit.id ? null : f)), 250);
      }
    },
    [onLog]
  );

  const handleLongPress = useCallback(
    (habit: Habit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      lastTap.current[habit.id] = 0;
      const ref = cellRefs.current[habit.id];
      if (!ref) return;
      ref.measure((_fx, _fy, _w, _h, px, py) => {
        if (habit.subHabits.length > 0) {
          setPopup({ habit, x: px, y: py, mode: "subHabits" });
        } else if (habit.isCustom) {
          setPopup({ habit, x: px, y: py, mode: "delete" });
        } else {
          onLog(habit);
        }
      });
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

  const handleDelete = useCallback(() => {
    if (!popup) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.(popup.habit.id);
    setPopup(null);
  }, [popup, onDelete]);

  const grouped = GROUPS.map((group) => ({
    group,
    items: habits.filter((h) => h.group === group || (!h.group && group === "Lifestyle")),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={styles.container}>
      {grouped.map(({ group, items }) => (
        <View key={group} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name={GROUP_ICONS[group] as any}
              size={13}
              color={colors.mutedForeground}
            />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {group}
            </Text>
          </View>

          <View style={styles.grid}>
            {items.map((habit) => (
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
                      backgroundColor:
                        flash === habit.id ? habit.color + "18" : colors.card,
                      borderColor:
                        flash === habit.id ? habit.color : colors.border,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: habit.color + "22" }]}>
                    <MaterialCommunityIcons
                      name={habit.icon as any}
                      size={26}
                      color={habit.color}
                    />
                  </View>
                  <Text style={[styles.cellLabel, { color: colors.foreground }]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  {habit.subHabits.length > 0 ? (
                    <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                      long-press
                    </Text>
                  ) : (
                    <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                      double-tap
                    </Text>
                  )}
                  {habit.isCustom && (
                    <View style={[styles.customBadge, { backgroundColor: habit.color + "30" }]}>
                      <MaterialCommunityIcons name="pencil-outline" size={8} color={habit.color} />
                    </View>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Sub-habit popup */}
      {popup && popup.mode === "subHabits" && (
        <Modal transparent animationType="fade" onRequestClose={() => setPopup(null)}>
          <Pressable style={styles.overlay} onPress={() => setPopup(null)}>
            <View
              style={[
                styles.popupCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  left: Math.max(8, Math.min(popup.x - 20, width - 240)),
                  top: Math.max(80, popup.y - 20),
                },
              ]}
            >
              <View style={styles.popupTitleRow}>
                <View style={[styles.popupIcon, { backgroundColor: popup.habit.color + "22" }]}>
                  <MaterialCommunityIcons
                    name={popup.habit.icon as any}
                    size={16}
                    color={popup.habit.color}
                  />
                </View>
                <Text style={[styles.popupTitle, { color: colors.foreground }]}>
                  {popup.habit.name}
                </Text>
              </View>
              <View style={styles.subRow}>
                {popup.habit.subHabits.map((sub) => (
                  <Pressable
                    key={sub.id}
                    onPress={() => handleSubLog(sub)}
                    style={({ pressed }) => [styles.subItem, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={[styles.subIconWrap, { backgroundColor: sub.color + "28" }]}>
                      <MaterialCommunityIcons name={sub.icon as any} size={20} color={sub.color} />
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

      {/* Delete popup */}
      {popup && popup.mode === "delete" && (
        <Modal transparent animationType="fade" onRequestClose={() => setPopup(null)}>
          <Pressable style={styles.overlay} onPress={() => setPopup(null)}>
            <View
              style={[
                styles.popupCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  left: Math.max(8, Math.min(popup.x - 20, width - 220)),
                  top: Math.max(80, popup.y - 20),
                  minWidth: 200,
                  alignItems: "center",
                },
              ]}
            >
              <View style={[styles.deleteIconWrap, { backgroundColor: popup.habit.color + "20" }]}>
                <MaterialCommunityIcons name={popup.habit.icon as any} size={30} color={popup.habit.color} />
              </View>
              <Text style={[styles.deleteHabitName, { color: colors.foreground }]}>{popup.habit.name}</Text>
              <Text style={[styles.deleteHint, { color: colors.mutedForeground }]}>
                Remove this custom habit?
              </Text>
              <View style={styles.deleteActions}>
                <Pressable onPress={() => setPopup(null)} style={[styles.deleteBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.deleteBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: "#c87070", borderColor: "#c87070" }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={13} color="#fff" />
                  <Text style={[styles.deleteBtnText, { color: "#fff" }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  section: {
    gap: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cellLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  hint: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
  },
  customBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  popupCard: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  popupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  popupIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  popupTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  subRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  subItem: {
    alignItems: "center",
    gap: 4,
    width: 58,
  },
  subIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  subLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  deleteIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteHabitName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  deleteHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  deleteActions: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
