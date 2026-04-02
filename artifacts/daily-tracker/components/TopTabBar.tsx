import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TopTabBarProps {
  activeTab: "log" | "dashboard";
  onTabChange: (tab: "log" | "dashboard") => void;
}

export function TopTabBar({ activeTab, onTabChange }: TopTabBarProps) {
  const colors = useColors();
  const logActive = activeTab === "log";
  const dashActive = activeTab === "dashboard";

  return (
    <View style={[styles.container, { shadowColor: colors.shadow }]}>
      <Pressable
        onPress={() => onTabChange("log")}
        style={[
          styles.tab,
          {
            backgroundColor: colors.primary,
            opacity: logActive ? 1 : 0.55,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          },
        ]}
      >
        <Text style={[styles.tabText, { color: "#ffffff", opacity: logActive ? 1 : 0.85 }]}>
          Log Activity
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onTabChange("dashboard")}
        style={[
          styles.tab,
          {
            backgroundColor: colors.tabInactive,
            opacity: dashActive ? 1 : 0.55,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          },
        ]}
      >
        <Text style={[styles.tabText, { color: "#ffffff", opacity: dashActive ? 1 : 0.85 }]}>
          Dashboard
        </Text>
      </Pressable>
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
