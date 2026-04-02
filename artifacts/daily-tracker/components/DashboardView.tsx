import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useLogs, type LogEntry } from "@/context/LogContext";
import { useHabits } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";
import { BarChartView } from "@/components/BarChartView";
import { LineChartView } from "@/components/LineChartView";

type TimeRange = "day" | "week" | "month" | "custom";
type LogCount = 5 | 10 | 20 | 50;

interface DashboardSettings {
  defaultTimeRange: TimeRange;
  showFrequencyChart: boolean;
  showInsightsChart: boolean;
  showDetailedLogs: boolean;
  logCount: LogCount;
  hiddenHabitIds: string[];
}

const DEFAULT_SETTINGS: DashboardSettings = {
  defaultTimeRange: "week",
  showFrequencyChart: true,
  showInsightsChart: true,
  showDetailedLogs: true,
  logCount: 10,
  hiddenHabitIds: [],
};

const SETTINGS_KEY = "@trace_dashboard_settings_v1";

function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((v) => {
        if (v) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(v) });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update, loaded };
}

function getRangeLabel(range: TimeRange): string {
  const now = new Date();
  if (range === "day") return `Today, ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Week: ${fmt(start)} – ${end.getDate()}`;
  }
  if (range === "month") return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return "Last 30 days";
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
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
};

function getHabitColor(habitId: string, habits: { id: string; color: string }[]): string {
  const h = habits.find((x) => x.id === habitId);
  if (h) return h.color;
  return HABIT_COLORS[habitId] ?? "#a0a0a0";
}

const RANGES: TimeRange[] = ["day", "week", "month", "custom"];
const LOG_COUNTS: LogCount[] = [5, 10, 20, 50];

export function DashboardView() {
  const colors = useColors();
  const { logs, getLogsForRange } = useLogs();
  const { habits } = useHabits();
  const { settings, update, loaded } = useDashboardSettings();
  const [timeRange, setTimeRange] = useState<TimeRange>(settings.defaultTimeRange);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (loaded) setTimeRange(settings.defaultTimeRange);
  }, [loaded]);

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

  const visibleHabitCounts = useMemo(
    () => habitCounts.filter((h) => !settings.hiddenHabitIds.includes(h.id)),
    [habitCounts, settings.hiddenHabitIds]
  );

  const weekTrend = useMemo(() => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const topTwo = visibleHabitCounts.slice(0, 2);
    const series = topTwo.map((h) => {
      const weekData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + i);
        const dateStr = d.toISOString().split("T")[0];
        return logs.filter((l) => l.habitId === h.id && l.timestamp.startsWith(dateStr)).length;
      });
      return {
        label: h.name,
        color: getHabitColor(h.id, habits),
        data: weekData,
      };
    });
    return { series, labels: days };
  }, [visibleHabitCounts, logs, habits]);

  const recentLogs = useMemo(
    () => rangeLogs.slice(0, settings.logCount),
    [rangeLogs, settings.logCount]
  );

  const toggleHiddenHabit = useCallback(
    (id: string) => {
      const hidden = settings.hiddenHabitIds;
      if (hidden.includes(id)) {
        update({ hiddenHabitIds: hidden.filter((x) => x !== id) });
      } else {
        update({ hiddenHabitIds: [...hidden, id] });
      }
    },
    [settings.hiddenHabitIds, update]
  );

  const allTrackedHabits = useMemo(() => {
    const inLogs = Array.from(new Set(logs.map((l) => l.habitId))).map((id) => {
      const log = logs.find((l) => l.habitId === id)!;
      const habit = habits.find((h) => h.id === id);
      return { id, name: log.habitName, color: habit?.color ?? getHabitColor(id, habits), icon: habit?.icon ?? "check" };
    });
    return inLogs;
  }, [logs, habits]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Time range bar */}
      <View style={[styles.timeBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.timeLabel, { color: colors.foreground }]}>
          {getRangeLabel(timeRange)}
        </Text>
        <View style={styles.rangePills}>
          {RANGES.map((r) => (
            <Pressable
              key={r}
              onPress={() => setTimeRange(r)}
              style={[
                styles.rangePill,
                {
                  backgroundColor: timeRange === r ? colors.primary + "18" : "transparent",
                  borderColor: timeRange === r ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.rangePillText,
                  {
                    color: timeRange === r ? colors.primary : colors.mutedForeground,
                    fontFamily: timeRange === r ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {r === "custom" ? "30d" : r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Charts */}
      {(settings.showFrequencyChart || settings.showInsightsChart) && (
        <View style={styles.chartsRow}>
          {settings.showFrequencyChart && (
            <View style={{ flex: 1 }}>
              {visibleHabitCounts.length > 0 ? (
                <BarChartView
                  data={visibleHabitCounts.map((h) => ({
                    label: h.name,
                    value: h.count,
                    color: getHabitColor(h.id, habits),
                  }))}
                  title="Frequency Overview"
                  subtitle="(Top Habits)"
                />
              ) : (
                <EmptyChart title="Frequency Overview" message="No logs yet" colors={colors} />
              )}
            </View>
          )}
          {settings.showInsightsChart && (
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
          )}
        </View>
      )}

      {/* Detailed Logs */}
      {settings.showDetailedLogs && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Detailed Logs</Text>
            <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
              {rangeLogs.length} entries
            </Text>
          </View>
          {recentLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No logs in this period
              </Text>
            </View>
          ) : (
            recentLogs.map((entry, i) => (
              <LogRow
                key={entry.id}
                entry={entry}
                colors={colors}
                habits={habits}
                showDate={timeRange !== "day"}
                isLast={i === recentLogs.length - 1}
              />
            ))
          )}
          {rangeLogs.length > settings.logCount && (
            <Text style={[styles.moreLabel, { color: colors.mutedForeground }]}>
              +{rangeLogs.length - settings.logCount} more — increase log count in settings
            </Text>
          )}
        </View>
      )}

      {/* Dashboard Settings */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={styles.settingsHeader}
          onPress={() => setSettingsOpen((o) => !o)}
        >
          <View style={styles.settingsTitleRow}>
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Dashboard Settings</Text>
          </View>
          <MaterialCommunityIcons
            name={settingsOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>

        {settingsOpen && (
          <View style={styles.settingsBody}>

            {/* Default time range */}
            <SettingsSection label="Default Time Range">
              <View style={styles.chipRow}>
                {RANGES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => update({ defaultTimeRange: r })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          settings.defaultTimeRange === r
                            ? colors.primary + "20"
                            : colors.background,
                        borderColor:
                          settings.defaultTimeRange === r
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            settings.defaultTimeRange === r
                              ? colors.primary
                              : colors.mutedForeground,
                          fontFamily:
                            settings.defaultTimeRange === r
                              ? "Inter_600SemiBold"
                              : "Inter_400Regular",
                        },
                      ]}
                    >
                      {r === "custom" ? "30 days" : r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SettingsSection>

            <Divider colors={colors} />

            {/* Visible sections */}
            <SettingsSection label="Visible Sections">
              <ToggleRow
                label="Frequency Overview chart"
                icon="chart-bar"
                value={settings.showFrequencyChart}
                onToggle={() => update({ showFrequencyChart: !settings.showFrequencyChart })}
                colors={colors}
              />
              <ToggleRow
                label="Specific Insights chart"
                icon="chart-line"
                value={settings.showInsightsChart}
                onToggle={() => update({ showInsightsChart: !settings.showInsightsChart })}
                colors={colors}
              />
              <ToggleRow
                label="Detailed Logs list"
                icon="format-list-bulleted"
                value={settings.showDetailedLogs}
                onToggle={() => update({ showDetailedLogs: !settings.showDetailedLogs })}
                colors={colors}
              />
            </SettingsSection>

            <Divider colors={colors} />

            {/* Log count */}
            <SettingsSection label="Log History Count">
              <View style={styles.chipRow}>
                {LOG_COUNTS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => update({ logCount: c })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          settings.logCount === c
                            ? colors.primary + "20"
                            : colors.background,
                        borderColor:
                          settings.logCount === c
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            settings.logCount === c
                              ? colors.primary
                              : colors.mutedForeground,
                          fontFamily:
                            settings.logCount === c
                              ? "Inter_600SemiBold"
                              : "Inter_400Regular",
                        },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SettingsSection>

            {allTrackedHabits.length > 0 && (
              <>
                <Divider colors={colors} />
                <SettingsSection label="Habits shown in charts">
                  {allTrackedHabits.map((h) => {
                    const hidden = settings.hiddenHabitIds.includes(h.id);
                    return (
                      <ToggleRow
                        key={h.id}
                        label={h.name}
                        icon={h.icon as any}
                        iconColor={h.color}
                        value={!hidden}
                        onToggle={() => toggleHiddenHabit(h.id)}
                        colors={colors}
                      />
                    );
                  })}
                </SettingsSection>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingsSection}>
      <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, color: "#a09080", marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function ToggleRow({
  label,
  icon,
  iconColor,
  value,
  onToggle,
  colors,
}: {
  label: string;
  icon: string;
  iconColor?: string;
  value: boolean;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: (iconColor ?? colors.primary) + "20" }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={15}
          color={iconColor ?? colors.primary}
        />
      </View>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "88" }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
        ios_backgroundColor={colors.border}
        style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
      />
    </Pressable>
  );
}

function LogRow({
  entry,
  colors,
  habits,
  showDate,
  isLast,
}: {
  entry: LogEntry;
  colors: any;
  habits: { id: string; color: string; icon: string }[];
  showDate: boolean;
  isLast: boolean;
}) {
  const color = getHabitColor(entry.habitId, habits);
  const icon = habits.find((h) => h.id === entry.habitId)?.icon ?? "check-circle-outline";
  return (
    <View style={[styles.logRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + "60" }]}>
      <View style={styles.logTimestamp}>
        {showDate && (
          <Text style={[styles.logDate, { color: colors.mutedForeground }]}>
            {formatDate(entry.timestamp)}
          </Text>
        )}
        <Text style={[styles.logTime, { color: colors.mutedForeground }]}>
          {formatTime(entry.timestamp)}
        </Text>
      </View>
      <View style={[styles.logIconWrap, { backgroundColor: color + "22" }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      </View>
      <View style={styles.logContent}>
        <Text style={[styles.logName, { color: colors.foreground }]} numberOfLines={1}>
          {entry.habitName}
          {entry.subLabel ? (
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              {" · "}{entry.subLabel}
            </Text>
          ) : null}
        </Text>
        {entry.notes ? (
          <Text style={[styles.logSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {entry.notes}
          </Text>
        ) : null}
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  timeLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  rangePills: {
    flexDirection: "row",
    gap: 6,
  },
  rangePill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rangePillText: {
    fontSize: 12,
  },
  chartsRow: {
    flexDirection: "row",
    gap: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  moreLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingTop: 4,
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
    paddingVertical: 8,
  },
  logTimestamp: {
    width: 54,
    gap: 1,
  },
  logDate: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
  },
  logTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  logIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  logContent: {
    flex: 1,
    gap: 2,
  },
  logName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  logSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsBody: {
    gap: 14,
  },
  settingsSection: {
    gap: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    borderRadius: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  toggleIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
