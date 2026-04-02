import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
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
import { useColors } from "@/hooks/useColors";

const ICONS = [
  "run", "walk", "bike", "swim", "weight-lifter", "yoga", "dumbbell", "heart-pulse",
  "food", "coffee", "water", "pill", "apple", "bread-slice",
  "book-open-variant", "pencil", "laptop", "phone", "music", "headphones",
  "home", "bed", "shower", "soap", "broom",
  "dog", "cat", "tree", "flower", "leaf",
  "star", "fire", "lightning-bolt", "emoticon-happy-outline",
  "meditation", "run-fast", "bicycle", "golf", "basketball", "soccer",
  "brain", "eye", "hand-heart", "arm-flex", "human-handsup",
];

const COLORS = [
  "#7ab8c4", "#8aaa70", "#c8a060", "#c87070",
  "#9090c0", "#c870a0", "#a09070", "#7090a8",
  "#90b8a0", "#b09880", "#60a880", "#c8a8b0",
];

interface AddCustomHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, icon: string, color: string) => void;
}

export function AddCustomHabitModal({ visible, onClose, onAdd }: AddCustomHabitModalProps) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedColor, setSelectedColor] = useState("#7ab8c4");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim(), selectedIcon, selectedColor);
      setName("");
      setSelectedIcon("star");
      setSelectedColor("#7ab8c4");
      onClose();
    }
  };

  const handleClose = () => {
    setName("");
    setSelectedIcon("star");
    setSelectedColor("#7ab8c4");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>Add Custom Habit</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, fontFamily: "Inter_400Regular" }]}
            autoFocus
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />

          <View style={[styles.preview, { backgroundColor: selectedColor + "20", borderColor: selectedColor + "40" }]}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor + "30" }]}>
              <MaterialCommunityIcons name={selectedIcon as any} size={32} color={selectedColor} />
            </View>
            <Text style={[styles.previewName, { color: colors.foreground }]}>
              {name || "Preview"}
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Choose Icon</Text>
          <ScrollView
            horizontal={false}
            style={styles.iconGrid}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <View style={styles.iconGridInner}>
              {ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor:
                        selectedIcon === icon ? selectedColor + "25" : colors.background,
                      borderColor:
                        selectedIcon === icon ? selectedColor : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={22}
                    color={selectedIcon === icon ? selectedColor : colors.mutedForeground}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Choose Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: color,
                    borderWidth: selectedColor === color ? 3 : 0,
                    borderColor: colors.foreground,
                    transform: [{ scale: selectedColor === color ? 1.15 : 1 }],
                  },
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: name.trim() ? colors.primary : colors.muted }]}
          >
            <Text style={[styles.addBtnText, { color: name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
              Add Habit
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    gap: 12,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d0ccc8",
    alignSelf: "center",
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  iconGrid: {
    maxHeight: 130,
  },
  iconGridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  addBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
