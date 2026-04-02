import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const { habits, addCustomHabit, removeHabit } = useHabits();
  const { addLog } = useLogs();
  const [lastLogged, setLastLogged] = useState<Date | null>(null);
  const [lastLabel, setLastLabel] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFreeNote, setShowFreeNote] = useState(false);
  const [freeNote, setFreeNote] = useState("");

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

  const handleFreeNote = useCallback(() => {
    if (!freeNote.trim()) return;
    addLog({
      habitId: "free_text",
      habitName: "Free Note",
      notes: freeNote.trim(),
    });
    setFreeNote("");
    setShowFreeNote(false);
    setLastLogged(new Date());
    setLastLabel("Free Note");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addLog, freeNote]);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HabitGrid habits={habits} onLog={handleLog} onDelete={removeHabit} />

        {/* Last logged indicator */}
        {lastLogged && (
          <View style={[styles.loggedBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <MaterialCommunityIcons name="check-circle" size={15} color={colors.primary} />
            <Text style={[styles.loggedText, { color: colors.primary }]}>
              Logged <Text style={{ fontFamily: "Inter_600SemiBold" }}>{lastLabel}</Text>
              {" · "}{formatLogTime(lastLogged)}
            </Text>
          </View>
        )}

        {/* Bottom actions */}
        <View style={styles.bottomRow}>
          <Pressable
            onPress={() => setShowFreeNote(true)}
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <MaterialCommunityIcons name="note-plus-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Add note</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowAddModal(true)}
            style={[styles.actionBtn, { borderColor: colors.primary + "50", backgroundColor: colors.primary + "10" }]}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Custom habit</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Free note modal */}
      <Modal
        visible={showFreeNote}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowFreeNote(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFreeNote(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={[styles.sheetIcon, { backgroundColor: colors.primary + "20" }]}>
                <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add a free note</Text>
              <Pressable onPress={() => setShowFreeNote(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <TextInput
              value={freeNote}
              onChangeText={setFreeNote}
              placeholder="Type anything — mood, observation, reminder..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.freeNoteInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  fontFamily: "Inter_400Regular",
                },
              ]}
              multiline
              autoFocus
            />
            <Pressable
              onPress={handleFreeNote}
              style={[
                styles.logBtn,
                { backgroundColor: freeNote.trim() ? colors.primary : colors.muted },
              ]}
            >
              <MaterialCommunityIcons name="check" size={16} color={freeNote.trim() ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.logBtnText, { color: freeNote.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                Save Note
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  bottomRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d0ccc8",
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sheetIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  freeNoteInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
  },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
