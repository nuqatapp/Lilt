import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  completionByDate: Record<string, number>;
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function WeekStrip({ selectedDate, onSelectDate, completionByDate }: WeekStripProps) {
  const colors = useColors();
  const dates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {dates.map((date) => {
        const isSelected = date === selectedDate;
        const isToday = date === today;
        const completion = completionByDate[date] ?? 0;
        const dayNum = new Date(date).getDate();
        const dow = new Date(date).getDay();

        return (
          <Pressable key={date} onPress={() => onSelectDate(date)} style={styles.dayItem}>
            <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
              {DAY_LABELS[dow]}
            </Text>
            <View
              style={[
                styles.dayCircle,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isToday
                    ? colors.primary + "20"
                    : "transparent",
                  borderColor: isToday && !isSelected ? colors.primary : "transparent",
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  {
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.foreground,
                    fontFamily: isSelected || isToday ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {dayNum}
              </Text>
            </View>
            <View style={styles.dotRow}>
              {completion > 0 && (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryForeground
                        : colors.primary,
                      opacity: Math.min(completion, 1),
                    },
                  ]}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 4,
  },
  dayItem: {
    alignItems: "center",
    width: 40,
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontSize: 15,
  },
  dotRow: {
    height: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
