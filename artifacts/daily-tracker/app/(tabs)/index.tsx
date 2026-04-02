import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardView } from "@/components/DashboardView";
import { LogActivityView } from "@/components/LogActivityView";
import { TopTabBar } from "@/components/TopTabBar";
import { useColors } from "@/hooks/useColors";

type Tab = "log" | "dashboard";

export default function MainScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("log");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topPad + 10, paddingBottom: 10 }}>
        <TopTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
      <View style={[styles.content, { paddingBottom: bottomPad }]}>
        {activeTab === "log" ? <LogActivityView /> : <DashboardView />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
