import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

interface TopTabBarProps {
  activeTab: "log" | "dashboard";
  onTabChange: (tab: "log" | "dashboard") => void;
}

export function TopTabBar({ activeTab, onTabChange }: TopTabBarProps) {
  const colors = useColors();
  const { t, isRTL } = useSettings();
  const logActive = activeTab === "log";
  const dashActive = activeTab === "dashboard";

  const tabs = isRTL
    ? [
        { key: "dashboard" as const, label: t("dashboard"), active: dashActive, bg: colors.tabInactive, left: false },
        { key: "log" as const, label: t("logActivity"), active: logActive, bg: colors.primary, left: true },
      ]
    : [
        { key: "log" as const, label: t("logActivity"), active: logActive, bg: colors.primary, left: true },
        { key: "dashboard" as const, label: t("dashboard"), active: dashActive, bg: colors.tabInactive, left: false },
      ];

  return (
    <View style={[styles.container, { shadowColor: colors.shadow }]}>
      {tabs.map((tab, idx) => (
        <Pressable
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          style={[
            styles.tab,
            {
              backgroundColor: tab.bg,
              opacity: tab.active ? 1 : 0.55,
              borderTopLeftRadius: idx === 0 ? 12 : 0,
              borderBottomLeftRadius: idx === 0 ? 12 : 0,
              borderTopRightRadius: idx === tabs.length - 1 ? 12 : 0,
              borderBottomRightRadius: idx === tabs.length - 1 ? 12 : 0,
            },
          ]}
        >
          <Text style={[styles.tabText, { color: "#ffffff", opacity: tab.active ? 1 : 0.85 }]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
