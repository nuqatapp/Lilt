import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface BarChartViewProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  title?: string;
  subtitle?: string;
}

export function BarChartView({ data, height = 120, title, subtitle }: BarChartViewProps) {
  const colors = useColors();
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barAreaH = height - 28;
  const barW = 24;
  const gap = 14;
  const totalW = data.length * (barW + gap) - gap + 20;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {(title || subtitle) && (
        <View style={styles.titleRow}>
          {title && (
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}{subtitle ? " " : ""}
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {subtitle}
                </Text>
              )}
            </Text>
          )}
        </View>
      )}
      <Svg width={Math.max(totalW, 200)} height={height + 20} style={styles.svg}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / maxVal) * barAreaH);
          const x = 10 + i * (barW + gap);
          const y = barAreaH - barH + 4;
          const barColor = d.color ?? colors.primary;
          return (
            <React.Fragment key={d.label}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={5}
                fill={barColor + "aa"}
              />
              <SvgText
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="11"
                fill={colors.foreground}
                fontWeight="600"
              >
                {d.value}
              </SvgText>
              <SvgText
                x={x + barW / 2}
                y={barAreaH + 18}
                textAnchor="middle"
                fontSize="10"
                fill={colors.mutedForeground}
              >
                {d.label.length > 7 ? d.label.slice(0, 7) : d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },
  titleRow: {
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  svg: {
    alignSelf: "flex-start",
  },
});
