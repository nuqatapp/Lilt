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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardView } from "@/components/DashboardView";
import { LogActivityView } from "@/components/LogActivityView";
import { TopTabBar } from "@/components/TopTabBar";
import { PERSON_COLORS, usePeople } from "@/context/PeopleContext";
import { useSettings, type Language, type Theme } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { exportData, importData, clearAllData } from "@/utils/DataBackup";

const logo = require("@/assets/images/icon.png");

type Tab = "log" | "dashboard";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.trim().substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { language, theme, isRTL, setLanguage, setTheme, t } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  type LangOption = { value: Language; label: string };
  type ThemeOption = { value: Theme; label: string; icon: string };

  const langOptions: LangOption[] = [
    { value: "en", label: "English" },
    { value: "ar", label: "عربي" },
  ];

  const themeOptions: ThemeOption[] = [
    { value: "light", label: t("light"), icon: "weather-sunny" },
    { value: "dark",  label: t("dark"),  icon: "weather-night" },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportData();
    setIsExporting(false);
    if (!result.success) {
      Alert.alert(t("exportError"), result.message);
    }
  };

  const handleImport = () => {
    Alert.alert(
      t("importData"),
      t("importDataDesc"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            if (Platform.OS === "ios") {
              Alert.prompt(
                t("importData"),
                "Paste your backup JSON here",
                [
                  { text: t("cancel"), style: "cancel" },
                  {
                    text: "Restore",
                    onPress: async (jsonString?: string) => {
                      if (!jsonString?.trim()) {
                        Alert.alert(t("importError"), t("importError"));
                        return;
                      }
                      const result = await importData(jsonString);
                      if (result.success) {
                        Alert.alert(t("importSuccess"), t("importSuccess"), [
                          { text: "OK", onPress: onClose },
                        ]);
                      } else {
                        Alert.alert(t("importError"), result.message);
                      }
                    },
                  },
                ],
                "plain-text"
              );
            } else {
              Alert.alert(t("importError"), "Paste import is only available on iOS. Please use a backup file.");
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t("clearConfirm"),
      t("clearConfirmMessage"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deleteAll"),
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            const result = await clearAllData();
            setIsClearing(false);
            if (result.success) {
              Alert.alert(t("clearSuccess"), "The app will need to be restarted.", [
                { text: "OK", onPress: onClose },
              ]);
            } else {
              Alert.alert(t("exportError"), result.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Header */}
            <View style={[styles.settingsHeader, isRTL && styles.rowReverse]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {t("settings")}
              </Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Language section */}
            <Text style={[styles.settingsSection, { color: colors.mutedForeground }, isRTL && styles.textRight]}>
              {t("language")}
            </Text>
            <View style={[styles.segmented, { backgroundColor: colors.background }]}>
              {langOptions.map((opt) => {
                const active = language === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setLanguage(opt.value)}
                    style={[styles.segment, active && { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.segmentText, { color: active ? "#fff" : colors.mutedForeground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Theme section */}
            <Text style={[styles.settingsSection, { color: colors.mutedForeground }, isRTL && styles.textRight]}>
              {t("theme")}
            </Text>
            <View style={[styles.segmented, { backgroundColor: colors.background }]}>
              {themeOptions.map((opt) => {
                const active = theme === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setTheme(opt.value)}
                    style={[styles.segment, styles.themeSegment, active && { backgroundColor: colors.primary }]}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={18}
                      color={active ? "#fff" : colors.mutedForeground}
                    />
                    <Text style={[styles.segmentText, { color: active ? "#fff" : colors.mutedForeground, marginLeft: 6 }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Data Management section */}
            <Text style={[styles.settingsSection, { color: colors.mutedForeground, marginTop: 24 }, isRTL && styles.textRight]}>
              {t("dataManagement")}
            </Text>

            {/* Export */}
            <Pressable
              onPress={handleExport}
              disabled={isExporting}
              style={[
                styles.dataButton,
                { backgroundColor: colors.card, borderColor: colors.primary, opacity: isExporting ? 0.6 : 1 },
                isRTL && styles.rowReverse,
              ]}
            >
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons
                  name="download"
                  size={20}
                  color={colors.primary}
                  style={isRTL && { marginLeft: 12 }}
                />
                <View style={isRTL ? { marginRight: 12 } : { marginLeft: 12 }}>
                  <Text style={[styles.buttonLabel, { color: colors.foreground }]}>
                    {isExporting ? t("exporting") : t("exportData")}
                  </Text>
                  <Text style={[styles.buttonDesc, { color: colors.mutedForeground }]}>
                    {t("exportDataDesc")}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Import */}
            <Pressable
              onPress={handleImport}
              style={[
                styles.dataButton,
                { backgroundColor: colors.card, borderColor: colors.primary },
                isRTL && styles.rowReverse,
              ]}
            >
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons
                  name="upload"
                  size={20}
                  color={colors.primary}
                  style={isRTL && { marginLeft: 12 }}
                />
                <View style={isRTL ? { marginRight: 12 } : { marginLeft: 12 }}>
                  <Text style={[styles.buttonLabel, { color: colors.foreground }]}>
                    {t("importData")}
                  </Text>
                  <Text style={[styles.buttonDesc, { color: colors.mutedForeground }]}>
                    {t("importDataDesc")}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Clear All */}
            <Pressable
              onPress={handleClearAll}
              disabled={isClearing}
              style={[
                styles.dataButton,
                { backgroundColor: colors.card, borderColor: "#c87868", opacity: isClearing ? 0.6 : 1 },
                isRTL && styles.rowReverse,
              ]}
            >
              <View style={styles.buttonContent}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color="#c87868"
                  style={isRTL && { marginLeft: 12 }}
                />
                <View style={isRTL ? { marginRight: 12 } : { marginLeft: 12 }}>
                  <Text style={[styles.buttonLabel, { color: "#c87868" }]}>
                    {isClearing ? t("clearing") : t("clearAllData")}
                  </Text>
                  <Text style={[styles.buttonDesc, { color: colors.mutedForeground }]}>
                    {t("clearAllDataDesc")}
                  </Text>
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
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
  const { t, isRTL } = useSettings();
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
              {initialName ? t("editPerson") : t("addPersonTitle")}
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("namePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              maxLength={30}
              textAlign={isRTL ? "right" : "left"}
              style={[
                styles.nameInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              autoFocus
              returnKeyType="done"
            />

            <Text style={[styles.colorLabel, { color: colors.mutedForeground }, isRTL && styles.textRight]}>
              {t("pickColour")}
            </Text>
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

            <View style={[styles.modalButtons, isRTL && styles.rowReverse]}>
              <Pressable onPress={onClose} style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => { if (canSave) { onSave(name.trim(), color); onClose(); } }}
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.4 }]}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>{t("save")}</Text>
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
  const { t, isRTL } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; color: string } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleLongPress(person: { id: string; name: string; color: string }) {
    Alert.alert(person.name, "What would you like to do?", [
      { text: t("editPerson"), onPress: () => setEditTarget(person) },
      {
        text: "Delete", style: "destructive", onPress: () => {
          Alert.alert("Delete", `Remove ${person.name}?`, [
            { text: t("cancel"), style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => removePerson(person.id) },
          ]);
        },
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Gear icon — always top-right in device coordinates */}
      <Pressable
        onPress={() => setShowSettings(true)}
        style={[styles.gearBtn, { top: topPad + 12 }]}
        hitSlop={12}
      >
        <MaterialCommunityIcons name="cog-outline" size={24} color={colors.mutedForeground} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.selectorContent, { paddingTop: topPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image source={logo} style={styles.selectorLogo} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.foreground }]}>Lilt</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>{t("appTagline")}</Text>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.foreground }, isRTL && styles.textRight]}>
          {people.length === 0 && loaded ? t("selectPerson") : t("selectPersonHas")}
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
              <Text style={[styles.personHint, { color: colors.mutedForeground }]}>{t("tapToOpen")}</Text>
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
            <Text style={[styles.personName, { color: colors.primary }]}>{t("addPerson")}</Text>
          </Pressable>
        </View>

        {loaded && people.length === 0 && (
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }, isRTL && styles.textRight]}>
            {t("emptyHint")}
          </Text>
        )}
      </ScrollView>

      <PersonModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(name, color) => addPerson(name, color)}
      />
      <PersonModal
        visible={!!editTarget}
        initialName={editTarget?.name}
        initialColor={editTarget?.color}
        onClose={() => setEditTarget(null)}
        onSave={(name, color) => { if (editTarget) updatePerson(editTarget.id, name, color); }}
      />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
    </View>
  );
}

// ── Person Detail Screen ──────────────────────────────────────────────────────
function PersonDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentPerson, setCurrentPersonId } = usePeople();
  const { isRTL } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("log");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentPerson) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Person header */}
      <View style={[styles.personHeader, { paddingTop: topPad + 6 }, isRTL && styles.rowReverse]}>
        <Pressable onPress={() => setCurrentPersonId(null)} style={styles.backBtn} hitSlop={12}>
          <MaterialCommunityIcons
            name={isRTL ? "chevron-right" : "chevron-left"}
            size={26}
            color={colors.foreground}
          />
        </Pressable>
        <View style={[styles.headerAvatar, { backgroundColor: currentPerson.color }]}>
          <Text style={styles.headerAvatarText}>{getInitials(currentPerson.name)}</Text>
        </View>
        <Text style={[styles.headerName, { color: colors.foreground }, isRTL && styles.textRight]} numberOfLines={1}>
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
  textRight: { textAlign: "right" },
  rowReverse: { flexDirection: "row-reverse" },

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

  // Gear button
  gearBtn: {
    position: "absolute",
    right: 18,
    zIndex: 10,
    padding: 4,
  },

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

  // Modals
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 44, gap: 16,
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

  // Settings modal specifics
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  settingsSection: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  themeSegment: {
    flexDirection: "row",
  },
  segmentText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dataButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buttonLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  buttonDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
