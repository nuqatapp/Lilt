import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface AddCustomHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddCustomHabitModal({ visible, onClose, onAdd }: AddCustomHabitModalProps) {
  const colors = useColors();
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Add Custom Habit</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter a name for your new habit:
          </Text>
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
          <View style={styles.btns}>
            <Pressable onPress={onClose} style={[styles.btn, { borderColor: colors.border }]}>
              <Text style={[styles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Add</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialog: {
    width: 300,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  btns: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
