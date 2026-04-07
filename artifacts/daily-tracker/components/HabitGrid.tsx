import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
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
  favoriteIds: string[];
  onLog: (habit: Habit, subHabit?: SubHabit, notes?: string) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

interface PopupState {
  habit: Habit;
  selectedSub: SubHabit | null;
  notes: string;
}

const DOUBLE_TAP_MS = 300;

export function HabitGrid({ habits, favoriteIds, onLog, onDelete, onToggleFavorite }: HabitGridProps) {
  const colors = useColors();
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [deletePopup, setDeletePopup] = useState<Habit | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const lastTap = useRef<Record<string, number>>({});
  const isLongPressing = useRef(false);

  const handlePress = useCallback(
    (habit: Habit) => {
      // Block the trailing onPress that Android fires after a long-press
      if (isLongPressing.current) {
        isLongPressing.current = false;
        return;
      }
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
      isLongPressing.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      lastTap.current[habit.id] = 0;
      if (habit.isCustom && habit.subHabits.length === 0) {
        setDeletePopup(habit);
      } else {
        setPopup({ habit, selectedSub: null, notes: "" });
      }
    },
    []
  );

  const handleSubmitLog = useCallback(() => {
    if (!popup) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onLog(popup.habit, popup.selectedSub ?? undefined, popup.notes.trim() || undefined);
    setPopup(null);
  }, [popup, onLog]);

  const handleDelete = useCallback(() => {
    if (!deletePopup) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.(deletePopup.id);
    setDeletePopup(null);
  }, [deletePopup, onDelete]);

  const favorites = habits.filter((h) => favoriteIds.includes(h.id));

  const grouped = GROUPS.map((group) => ({
    group,
    items: habits.filter((h) => h.group === group || (!h.group && group === "Lifestyle")),
  })).filter((g) => g.items.length > 0);

  const renderCell = (habit: Habit, compact = false) => {
    const isFav = favoriteIds.includes(habit.id);
    const cellW = compact ? CELL_SIZE : "100%";
    return (
      <Pressable
        key={habit.id}
        onPress={() => handlePress(habit)}
        onLongPress={() => handleLongPress(habit)}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.cell,
          {
            width: cellW,
            backgroundColor: flash === habit.id ? habit.color + "18" : colors.card,
            borderColor: flash === habit.id ? habit.color : isFav ? habit.color + "80" : colors.border,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        {isFav && !compact && (
          <View style={[styles.favBadge, { backgroundColor: habit.color + "30" }]}>
            <MaterialCommunityIcons name="star" size={8} color={habit.color} />
          </View>
        )}
        <View style={[styles.iconWrap, { backgroundColor: habit.color + "22" }]}>
          <MaterialCommunityIcons name={habit.icon as any} size={26} color={habit.color} />
        </View>
        <Text style={[styles.cellLabel, { color: colors.foreground }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          {"double-tap"}
        </Text>
        {habit.isCustom && (
          <View style={[styles.customBadge, { backgroundColor: habit.color + "30" }]}>
            <MaterialCommunityIcons name="pencil-outline" size={8} color={habit.color} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Favourites ──────────────────────────────────────── */}
      {favorites.length === 0 ? (
        <View style={[styles.emptyFav, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="star-outline" size={22} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.emptyFavTitle, { color: colors.foreground }]}>No favourites yet</Text>
            <Text style={[styles.emptyFavSub, { color: colors.mutedForeground }]}>
              Long-press any habit and tap ☆ to pin it here
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="star" size={13} color="#e8b84b" />
            <Text style={[styles.sectionLabel, { color: "#c49830" }]}>FAVOURITES</Text>
          </View>
          <View style={styles.grid}>
            {favorites.map((h) => (
              <View key={h.id} style={[styles.cellWrap, { width: CELL_SIZE }]}>
                {renderCell(h)}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Grouped habits ───────────────────────────────────── */}
      {grouped.map(({ group, items }) => (
        <View key={group} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name={GROUP_ICONS[group] as any} size={13} color={colors.mutedForeground} />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{group.toUpperCase()}</Text>
          </View>
          <View style={styles.grid}>
            {items.map((habit) => (
              <View key={habit.id} style={[styles.cellWrap, { width: CELL_SIZE }]}>
                {renderCell(habit)}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* ── Log popup (sub-habits) ─────────────────────────── */}
      {popup && (
        <Modal
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() => setPopup(null)}
        >
          <KeyboardAvoidingView
            style={styles.sheetOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPopup(null)} />
            <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sheetHandle} />

              {/* Header row with star toggle */}
              <View style={styles.sheetHeaderRow}>
                <View style={[styles.sheetHabitIcon, { backgroundColor: popup.habit.color + "22" }]}>
                  <MaterialCommunityIcons name={popup.habit.icon as any} size={20} color={popup.habit.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetHabitName, { color: colors.foreground }]}>
                    {popup.habit.name}
                  </Text>
                  {popup.selectedSub && (
                    <Text style={[styles.sheetSubSelected, { color: popup.habit.color }]}>
                      {popup.selectedSub.label}
                    </Text>
                  )}
                </View>
                {/* Favourite star */}
                <Pressable
                  onPress={() => {
                    onToggleFavorite(popup.habit.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.starBtn,
                    {
                      backgroundColor: favoriteIds.includes(popup.habit.id)
                        ? "#e8b84b30"
                        : colors.background,
                      borderColor: favoriteIds.includes(popup.habit.id)
                        ? "#e8b84b"
                        : colors.border,
                    },
                  ]}
                  hitSlop={6}
                >
                  <MaterialCommunityIcons
                    name={favoriteIds.includes(popup.habit.id) ? "star" : "star-outline"}
                    size={18}
                    color={favoriteIds.includes(popup.habit.id) ? "#e8b84b" : colors.mutedForeground}
                  />
                </Pressable>
                <Pressable onPress={() => setPopup(null)} hitSlop={10} style={{ marginLeft: 4 }}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              {/* Sub-habit picker */}
              {popup.habit.subHabits.length > 0 && (
                <View>
                  <Text style={[styles.sheetSectionLabel, { color: colors.mutedForeground }]}>
                    SELECT CATEGORY
                  </Text>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 220 }}
                    nestedScrollEnabled
                  >
                    <View style={styles.subRow}>
                      {popup.habit.subHabits.map((sub) => {
                        const selected = popup.selectedSub?.id === sub.id;
                        return (
                          <Pressable
                            key={sub.id}
                            onPress={() =>
                              setPopup((p) => p ? { ...p, selectedSub: selected ? null : sub } : null)
                            }
                            style={[
                              styles.subChip,
                              {
                                backgroundColor: selected ? sub.color + "25" : colors.background,
                                borderColor: selected ? sub.color : colors.border,
                              },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={sub.icon as any}
                              size={14}
                              color={selected ? sub.color : colors.mutedForeground}
                            />
                            <Text
                              style={[
                                styles.subChipText,
                                {
                                  color: selected ? sub.color : colors.foreground,
                                  fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
                                },
                              ]}
                            >
                              {sub.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Notes input */}
              <TextInput
                value={popup.notes}
                onChangeText={(t) => setPopup((p) => (p ? { ...p, notes: t } : null))}
                placeholder="Add a note (optional)..."
                placeholderTextColor={colors.mutedForeground}
                maxLength={200}
                multiline
                numberOfLines={2}
                style={[
                  styles.notesInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
                returnKeyType="done"
                blurOnSubmit
              />

              {/* Log button */}
              <Pressable
                onPress={handleSubmitLog}
                style={[styles.logBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialCommunityIcons name="check" size={18} color={colors.primaryForeground} />
                <Text style={[styles.logBtnText, { color: colors.primaryForeground }]}>
                  Log{popup.selectedSub ? ` · ${popup.selectedSub.label}` : ` ${popup.habit.name}`}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ── Delete popup ───────────────────────────────────── */}
      {deletePopup && (
        <Modal transparent animationType="fade" onRequestClose={() => setDeletePopup(null)}>
          <Pressable style={styles.overlayCenter} onPress={() => setDeletePopup(null)}>
            <View style={[styles.deleteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.deleteIconWrap, { backgroundColor: deletePopup.color + "20" }]}>
                <MaterialCommunityIcons name={deletePopup.icon as any} size={30} color={deletePopup.color} />
              </View>
              <Text style={[styles.deleteHabitName, { color: colors.foreground }]}>{deletePopup.name}</Text>
              <Text style={[styles.deleteHint, { color: colors.mutedForeground }]}>Remove this custom habit?</Text>
              <View style={styles.deleteActions}>
                <Pressable onPress={() => setDeletePopup(null)} style={[styles.deleteBtn, { borderColor: colors.border }]}>
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
  container: { gap: 18 },
  section: { gap: 8, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cellWrap: { alignItems: "center" },
  cell: {
    borderRadius: 12, borderWidth: 1, padding: 8,
    alignItems: "center", gap: 4, minHeight: 80, justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cellLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  hint: { fontSize: 8, fontFamily: "Inter_400Regular" },
  favBadge: {
    position: "absolute", top: 5, left: 5, width: 14, height: 14,
    borderRadius: 7, alignItems: "center", justifyContent: "center",
  },
  customBadge: {
    position: "absolute", top: 5, right: 5, width: 14, height: 14,
    borderRadius: 7, alignItems: "center", justifyContent: "center",
  },
  emptyFav: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1,
    borderStyle: "dashed", paddingHorizontal: 14, paddingVertical: 12,
  },
  emptyFavTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  emptyFavSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    padding: 20, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#d0ccc8", alignSelf: "center", marginBottom: 4 },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetHabitIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sheetHabitName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sheetSubSelected: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 1 },
  sheetSectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  starBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  subRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 22, borderWidth: 1.5,
    paddingHorizontal: 12, paddingVertical: 12,
    minWidth: 44, minHeight: 44,
  },
  subChipText: { fontSize: 13 },
  notesInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14,
  },
  logBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  logBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Delete
  overlayCenter: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  deleteCard: {
    width: 260, borderRadius: 18, borderWidth: 1, padding: 20, gap: 10, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  deleteIconWrap: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  deleteHabitName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  deleteHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  deleteActions: { flexDirection: "row", gap: 8, width: "100%" },
  deleteBtn: {
    flex: 1, flexDirection: "row", gap: 4, borderWidth: 1,
    borderRadius: 8, paddingVertical: 9, alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
