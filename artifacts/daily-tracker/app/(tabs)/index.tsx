import React, { useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardView } from "@/components/DashboardView";
import { LogActivityView } from "@/components/LogActivityView";
import { TopTabBar } from "@/components/TopTabBar";
import { useColors } from "@/hooks/useColors";

const logo = require("@/assets/images/icon.png");

type Tab = "log" | "dashboard";

export default function MainScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("log");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6 }]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={{ paddingBottom: 10 }}>
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
  header: {
    alignItems: "center",
    paddingBottom: 10,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  content: {
    flex: 1,
  },
});
