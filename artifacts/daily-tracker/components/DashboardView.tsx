import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLogs, type LogEntry } from "@/context/LogContext";
import { useColors } from "@/hooks/useColors";
import { BarChartView } from "@/components/BarChartView";
import { LineChartView } from "@/components/LineChartView";

type TimeRange = "day" | "week" | "month" | "custom";

function getRangeLabel(range: TimeRange): string {
  const now = new Date();
  if (range === "day") {
    return `Today, ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Week: ${fmt(start)}-${end.getDate()}`;
  }
  if (range === "month") {
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return "Custom";
}

function getDateRange(range: TimeRange): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (range === "day") return { start: today, end: today };
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }
  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  return { start: start.toISOString().split("T")[0], end: today };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

const HABIT_COLORS: Record<string, string> = {
  shower: "#7ab8c4",
  exercise: "#8aaa70",
  bathroom: "#a0b8c8",
  eating: "#c8a060",
  walking: "#a09070",
  cleaning: "#90b8a0",
  sleeping: "#9090c0",
  reading: "#c09060",
  work: "#7090a8",
  stretching: "#b09880",
  free_text: "#b0a090",
};

function getHabitColor(habitId: string): string {
  return HABIT_COLORS[habitId] ?? "#a0a0a0";
}

export function DashboardView() {
  const colors = useColors();
  const { logs, getLogsForRange } = useLogs();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const { start, end } = useMemo(() => getDateRange(timeRange), [timeRange]);
  const rangeLogs = useMemo(() => getLogsForRange(start, end), [getLogsForRange, start, end]);

  const habitCounts = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    rangeLogs.forEach((l) => {
      if (!counts[l.habitId]) counts[l.habitId] = { name: l.habitName, count: 0 };
      counts[l.habitId].count++;
    });
    return Object.entries(counts)
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [rangeLogs]);

  const weekTrend = useMemo(() => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const topTwo = habitCounts.slice(0, 2);
    const series = topTwo.map((h) => {
      const weekData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + i);
        const dateStr = d.toISOString().split("T")[0];
        return logs.filter(
          (l) => l.habitId === h.id && l.timestamp.startsWith(dateStr)
        ).length;
      });
      return {
        label: h.name,
        color: getHabitColor(h.id),
        data: weekData,
      };
    });
    return { series, labels: days };
  }, [habitCounts, logs]);

  const recentLogs = useMemo(
    () => rangeLogs.slice(0, 10),
    [rangeLogs]
  );

  const RANGES: TimeRange[] = ["day", "week", "month", "custom"];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.timeBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.timeLabel, { color: colors.foreground }]}>Time:</Text>
        <View style={[styles.timeDropdown, { borderColor: colors.border }]}>
          <Text style={[styles.timeDropdownText, { color: colors.foreground }]}>
            {getRangeLabel(timeRange)}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color={colors.mutedForeground} />
        </View>
        <View style={styles.rangePills}>
          {RANGES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setTimeRange(r)}
              style={styles.rangePill}
            >
              <Text
                style={[
                  styles.rangePillText,
                  {
                    color: timeRange === r ? colors.primary : colors.mutedForeground,
                    fontFamily: timeRange === r ? "Inter_600SemiBold" : "Inter_400Regular",
                    textDecorationLine: timeRange === r ? "underline" : "none",
                  },
                ]}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.chartsRow}>
        <View style={{ flex: 1 }}>
          {habitCounts.length > 0 ? (
            <BarChartView
              data={habitCounts.map((h) => ({
                label: h.name,
                value: h.count,
                color: getHabitColor(h.id),
              }))}
              title="Frequency Overview"
              subtitle="(Top Habits)"
            />
          ) : (
            <EmptyChart title="Frequency Overview" message="No logs yet" colors={colors} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {weekTrend.series.length > 0 ? (
            <LineChartView
              series={weekTrend.series}
              xLabels={weekTrend.labels}
              title="Specific Insights"
            />
          ) : (
            <EmptyChart title="Specific Insights" message="Log more habits" colors={colors} />
          )}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={[styles.logsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Detailed Logs</Text>
          {recentLogs.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No logs in this period
            </Text>
          ) : (
            recentLogs.map((entry) => (
              <LogRow key={entry.id} entry={entry} colors={colors} />
            ))
          )}
        </View>

        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingsHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Dashboard Settings
            </Text>
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.settingsDesc, { color: colors.mutedForeground }]}>
            Customize which high-level habits appear as graphs.
          </Text>
          <View style={styles.settingsHabits}>
            {habitCounts.slice(0, 3).map((h) => (
              <View key={h.id} style={[styles.settingsChip, { backgroundColor: getHabitColor(h.id) + "22", borderColor: getHabitColor(h.id) + "55" }]}>
                <Text style={[styles.settingsChipText, { color: getHabitColor(h.id) }]}>{h.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        * Tap to log instantly. Long-press for details. Free text captured with date and time.
      </Text>
    </ScrollView>
  );
}

function LogRow({ entry, colors }: { entry: LogEntry; colors: any }) {
  return (
    <View style={styles.logRow}>
      <Text style={[styles.logTime, { color: colors.mutedForeground }]}>
        {formatTime(entry.timestamp)}
      </Text>
      <View style={[styles.logIconWrap, { backgroundColor: getHabitColor(entry.habitId) + "22" }]}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={16}
          color={getHabitColor(entry.habitId)}
        />
      </View>
      <View style={styles.logContent}>
        <Text style={[styles.logName, { color: colors.foreground }]} numberOfLines={1}>
          {entry.habitName}
        </Text>
        {(entry.subLabel || entry.notes) && (
          <Text style={[styles.logSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {entry.subLabel ?? ""}
            {entry.notes ? (entry.subLabel ? ` — ${entry.notes}` : entry.notes) : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

function EmptyChart({ title, message, colors }: { title: string; message: string; colors: any }) {
  return (
    <View style={[styles.emptyChart, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  timeBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    flexWrap: "wrap",
  },
  timeLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  timeDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  timeDropdownText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  rangePills: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
    justifyContent: "flex-end",
  },
  rangePill: {
    paddingVertical: 2,
  },
  rangePillText: {
    fontSize: 13,
  },
  chartsRow: {
    flexDirection: "row",
    gap: 8,
  },
  bottomRow: {
    gap: 8,
  },
  logsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  settingsHabits: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  settingsChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  settingsChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
  emptyChart: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    minHeight: 80,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  logTime: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 56,
    paddingTop: 1,
  },
  logIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  logContent: {
    flex: 1,
    gap: 1,
  },
  logName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  logSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
});
