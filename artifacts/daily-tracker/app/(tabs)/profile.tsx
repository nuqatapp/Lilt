import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHabits } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, completions } = useHabits();
  const colorScheme = useColorScheme();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalCompletions = completions.length;
  const totalHabits = habits.length;

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all habits and completion records. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await AsyncStorage.clear();
            Alert.alert("Cleared", "All data has been deleted. Restart the app.");
          },
        },
      ]
    );
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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Profile</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color={colors.primary} />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryName}>Daily Tracker</Text>
            <Text style={styles.summarySubtitle}>
              {totalHabits} habit{totalHabits !== 1 ? "s" : ""} · {totalCompletions} completions
            </Text>
          </View>
        </View>

        <SectionHeader title="Overview" colors={colors} />
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon="check-circle"
            label="Total Completions"
            value={totalCompletions.toString()}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="layers"
            label="Active Habits"
            value={totalHabits.toString()}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="calendar"
            label="Member Since"
            value="Today"
            colors={colors}
          />
        </View>

        <SectionHeader title="App" colors={colors} />
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon="moon"
            label="Appearance"
            value={colorScheme === "dark" ? "Dark" : "Light"}
            colors={colors}
          />
          <Divider colors={colors} />
          <MenuItem
            icon="bell"
            label="Notifications"
            value="System"
            colors={colors}
          />
        </View>

        <SectionHeader title="Data" colors={colors} />
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={handleClearData}
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.destructive + "20" }]}>
              <Feather name="trash-2" size={18} color={colors.destructive} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.destructive, flex: 1 }]}>
              Clear All Data
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Daily Tracker v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

function MenuItem({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value?: string;
  colors: any;
}) {
  return (
    <View style={styles.menuItem}>
      <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon as any} size={18} color={colors.foreground} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.foreground, flex: 1 }]}>{label}</Text>
      {value && (
        <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>{value}</Text>
      )}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: colors.border, marginLeft: 54 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 10,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    flex: 1,
    gap: 4,
  },
  summaryName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  summarySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: 2,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  menuValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginRight: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  version: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    paddingBottom: 8,
  },
});
