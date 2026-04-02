import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface TopTabBarProps {
  activeTab: "log" | "dashboard";
  onTabChange: (tab: "log" | "dashboard") => void;
}

export function TopTabBar({ activeTab, onTabChange }: TopTabBarProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
      <Pressable
        onPress={() => onTabChange("log")}
        style={[
          styles.tab,
          {
            backgroundColor:
              activeTab === "log" ? colors.primary : colors.tabInactive,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
          },
        ]}
      >
        <Text style={[styles.tabText, { color: colors.primaryForeground }]}>
          Log Activity
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onTabChange("dashboard")}
        style={[
          styles.tab,
          {
            backgroundColor:
              activeTab === "dashboard" ? colors.primary : colors.tabInactive,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
          },
        ]}
      >
        <Text style={[styles.tabText, { color: colors.primaryForeground }]}>
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
    borderRadius: 10,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
