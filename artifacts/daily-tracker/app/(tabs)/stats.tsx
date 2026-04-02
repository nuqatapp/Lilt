import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHabits } from "@/context/HabitsContext";
import { CATEGORY_COLORS } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, completions, getStreakForHabit, isCompleted, getHabitsForDate } = useHabits();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const overallStats = useMemo(() => {
    const total = completions.length;
    const best = habits.reduce((max, h) => Math.max(max, getStreakForHabit(h.id)), 0);
    const today = new Date().toISOString().split("T")[0];
    const todayHabits = getHabitsForDate(today);
    const todayDone = todayHabits.filter((h) => isCompleted(h.id, today)).length;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
    let weekCompletions = 0;
    let weekTotal = 0;
    last7.forEach((date) => {
      const dayHabits = getHabitsForDate(date);
      weekTotal += dayHabits.length;
      weekCompletions += dayHabits.filter((h) => isCompleted(h.id, date)).length;
    });
    const weekRate = weekTotal > 0 ? weekCompletions / weekTotal : 0;

    return { total, best, todayDone, todayTotal: todayHabits.length, weekRate };
  }, [habits, completions, getStreakForHabit, isCompleted, getHabitsForDate]);

  const last30Days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayHabits = getHabitsForDate(dateStr);
      const done = dayHabits.filter((h) => isCompleted(h.id, dateStr)).length;
      return {
        date: dateStr,
        done,
        total: dayHabits.length,
        rate: dayHabits.length > 0 ? done / dayHabits.length : 0,
      };
    });
  }, [habits, completions, isCompleted, getHabitsForDate]);

  const habitStats = useMemo(() => {
    return habits.map((habit) => {
      const streak = getStreakForHabit(habit.id);
      const total = completions.filter((c) => c.habitId === habit.id).length;
      return { habit, streak, total };
    }).sort((a, b) => b.streak - a.streak);
  }, [habits, completions, getStreakForHabit]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: Platform.OS === "web" ? 120 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Statistics</Text>

        <View style={styles.overviewGrid}>
          <BigStatCard label="Total done" value={overallStats.total.toString()} icon="check-circle" color={colors.primary} />
          <BigStatCard label="Best streak" value={overallStats.best.toString()} icon="zap" color="#f59e0b" />
          <BigStatCard
            label="Today"
            value={`${overallStats.todayDone}/${overallStats.todayTotal}`}
            icon="sun"
            color="#22c55e"
          />
          <BigStatCard
            label="Week rate"
            value={`${Math.round(overallStats.weekRate * 100)}%`}
            icon="trending-up"
            color="#8b5cf6"
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Last 30 Days</Text>
        <View style={[styles.heatmapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heatmap}>
            {last30Days.map(({ date, rate, total }) => (
              <View
                key={date}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor:
                      total === 0
                        ? colors.muted
                        : rate === 0
                        ? colors.border
                        : rate < 0.5
                        ? colors.primary + "50"
                        : rate < 1
                        ? colors.primary + "90"
                        : colors.primary,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.heatLegend}>
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Less</Text>
            {[colors.border, colors.primary + "50", colors.primary + "90", colors.primary].map((c, i) => (
              <View key={i} style={[styles.legendDot, { backgroundColor: c }]} />
            ))}
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>More</Text>
          </View>
        </View>

        {habitStats.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Habit Breakdown</Text>
            <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {habitStats.map(({ habit, streak, total }, idx) => (
                <View key={habit.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <View style={styles.breakdownRow}>
                    <View style={[styles.habitDot, { backgroundColor: habit.color + "25" }]}>
                      <View style={[styles.habitDotInner, { backgroundColor: habit.color }]} />
                    </View>
                    <Text style={[styles.habitName, { color: colors.foreground }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <View style={styles.habitMetrics}>
                      <View style={styles.metricPair}>
                        <Feather name="zap" size={12} color="#f59e0b" />
                        <Text style={[styles.metricVal, { color: colors.foreground }]}>{streak}</Text>
                      </View>
                      <View style={styles.metricPair}>
                        <Feather name="check" size={12} color={colors.primary} />
                        <Text style={[styles.metricVal, { color: colors.foreground }]}>{total}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {habits.length === 0 && (
          <View style={styles.empty}>
            <Feather name="bar-chart-2" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add some habits to see your stats
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function BigStatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.bigStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.bigStatIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.bigStatValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.bigStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bigStat: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  bigStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bigStatValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  bigStatLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 6,
  },
  heatmapCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  heatCell: {
    width: "6%",
    aspectRatio: 1,
    borderRadius: 3,
    minWidth: 16,
  },
  heatLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  breakdownCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  habitDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  habitDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  habitName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  habitMetrics: {
    flexDirection: "row",
    gap: 12,
  },
  metricPair: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricVal: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
