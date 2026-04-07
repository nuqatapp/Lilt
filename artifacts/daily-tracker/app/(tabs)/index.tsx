import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardView } from "@/components/DashboardView";
import { LogActivityView } from "@/components/LogActivityView";
import { TopTabBar } from "@/components/TopTabBar";
import { PERSON_COLORS, usePeople } from "@/context/PeopleContext";
import { useColors } from "@/hooks/useColors";

const logo = require("@/assets/images/icon.png");

type Tab = "log" | "dashboard";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.trim().substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Add / Edit Person Modal ───────────────────────────────────────────────────
interface PersonModalProps {
  visible: boolean;
  initialName?: string;
  initialColor?: string;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

function PersonModal({ visible, initialName = "", initialColor, onClose, onSave }: PersonModalProps) {
  const colors = useColors();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor ?? PERSON_COLORS[0]);

  React.useEffect(() => {
    if (visible) { setName(initialName); setColor(initialColor ?? PERSON_COLORS[0]); }
  }, [visible, initialName, initialColor]);

  const canSave = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {initialName ? "Edit Person" : "Add Person"}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name (e.g. Bader)"
            placeholderTextColor={colors.mutedForeground}
            maxLength={30}
            style={[styles.nameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            autoFocus
            returnKeyType="done"
          />

          <Text style={[styles.colorLabel, { color: colors.mutedForeground }]}>Pick a colour</Text>
          <View style={styles.colorRow}>
            {PERSON_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSwatchSelected,
                ]}
              >
                {color === c && (
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Pressable onPress={onClose} style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => { if (canSave) { onSave(name.trim(), color); onClose(); } }}
              style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.4 }]}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── People Selector Screen ────────────────────────────────────────────────────
function PeopleSelectorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { people, loaded, addPerson, updatePerson, removePerson, setCurrentPersonId } = usePeople();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; color: string } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleLongPress(person: { id: string; name: string; color: string }) {
    Alert.alert(person.name, "What would you like to do?", [
      { text: "Edit", onPress: () => setEditTarget(person) },
      { text: "Delete", style: "destructive", onPress: () => {
        Alert.alert("Delete", `Remove ${person.name}?`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => removePerson(person.id) },
        ]);
      }},
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.selectorContent, { paddingTop: topPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image source={logo} style={styles.selectorLogo} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.foreground }]}>Lilt</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>Daily Activity Tracker</Text>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
          {people.length === 0 && loaded ? "Who are you tracking?" : "Select a person"}
        </Text>

        {/* Person grid */}
        <View style={styles.personGrid}>
          {people.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => setCurrentPersonId(person.id)}
              onLongPress={() => handleLongPress(person)}
              delayLongPress={450}
              style={({ pressed }) => [
                styles.personCard,
                { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: person.color }]}>
                <Text style={styles.avatarText}>{getInitials(person.name)}</Text>
              </View>
              <Text style={[styles.personName, { color: colors.foreground }]} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={[styles.personHint, { color: colors.mutedForeground }]}>tap to open</Text>
            </Pressable>
          ))}

          {/* Add person card */}
          <Pressable
            onPress={() => setShowAdd(true)}
            style={({ pressed }) => [
              styles.personCard,
              styles.addCard,
              { borderColor: colors.primary + "50", backgroundColor: colors.primary + "0a", opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <MaterialCommunityIcons name="plus" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.personName, { color: colors.primary }]}>Add Person</Text>
          </Pressable>
        </View>

        {loaded && people.length === 0 && (
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            Add a person above to start tracking their daily activities.
          </Text>
        )}
      </ScrollView>

      {/* Add modal */}
      <PersonModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(name, color) => addPerson(name, color)}
      />

      {/* Edit modal */}
      <PersonModal
        visible={!!editTarget}
        initialName={editTarget?.name}
        initialColor={editTarget?.color}
        onClose={() => setEditTarget(null)}
        onSave={(name, color) => { if (editTarget) updatePerson(editTarget.id, name, color); }}
      />
    </View>
  );
}

// ── Person Detail Screen ──────────────────────────────────────────────────────
function PersonDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentPerson, setCurrentPersonId } = usePeople();
  const [activeTab, setActiveTab] = useState<Tab>("log");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentPerson) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Person header */}
      <View style={[styles.personHeader, { paddingTop: topPad + 6 }]}>
        <Pressable onPress={() => setCurrentPersonId(null)} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <View style={[styles.headerAvatar, { backgroundColor: currentPerson.color }]}>
          <Text style={styles.headerAvatarText}>{getInitials(currentPerson.name)}</Text>
        </View>
        <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
          {currentPerson.name}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tab bar */}
      <View style={{ paddingBottom: 10 }}>
        <TopTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: bottomPad }]}>
        {activeTab === "log"
          ? <LogActivityView personName={currentPerson.name} />
          : <DashboardView />}
      </View>
    </View>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function MainScreen() {
  const { currentPersonId } = usePeople();
  return currentPersonId ? <PersonDetailScreen /> : <PeopleSelectorScreen />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },

  // People selector
  selectorContent: { paddingHorizontal: 20, paddingBottom: 40 },
  logoRow: { alignItems: "center", marginBottom: 28 },
  selectorLogo: { width: 90, height: 90, borderRadius: 22 },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 10, letterSpacing: -0.3 },
  appTagline: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  sectionHeading: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  personGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  personCard: {
    width: "47%",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    shadowColor: "rgba(160,148,132,0.22)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  addCard: { borderWidth: 1.5, borderStyle: "dashed" },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  personName: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  personHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  emptyHint: { textAlign: "center", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 24, lineHeight: 20 },

  // Person detail header
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: { width: 38, alignItems: "center" },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  headerAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  headerName: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  nameInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, fontFamily: "Inter_400Regular",
  },
  colorLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.6 },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  colorSwatchSelected: { borderWidth: 3, borderColor: "rgba(0,0,0,0.25)" },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelBtn: { borderWidth: 1 },
  saveBtn: {},
  modalBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
