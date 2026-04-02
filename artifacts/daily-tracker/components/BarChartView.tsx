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

export function BarChartView({ data, height = 160, title, subtitle }: BarChartViewProps) {
  const colors = useColors();
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barAreaH = height - 32;
  const barW = 36;
  const gap = 20;
  const leftPad = 12;
  const totalW = data.length * (barW + gap) - gap + leftPad * 2;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {(title || subtitle) && (
        <View style={styles.titleRow}>
          {title && (
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {" "}{subtitle}
                </Text>
              ) : null}
            </Text>
          )}
        </View>
      )}
      <Svg width={Math.max(totalW, 280)} height={height + 24} style={styles.svg}>
        {data.map((d, i) => {
          const barH = Math.max(6, (d.value / maxVal) * barAreaH);
          const x = leftPad + i * (barW + gap);
          const y = barAreaH - barH + 6;
          const barColor = d.color ?? colors.primary;
          return (
            <React.Fragment key={d.label}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={8}
                fill={barColor + "cc"}
              />
              <SvgText
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="13"
                fill={colors.foreground}
                fontWeight="700"
              >
                {d.value}
              </SvgText>
              <SvgText
                x={x + barW / 2}
                y={barAreaH + 22}
                textAnchor="middle"
                fontSize="11"
                fill={colors.mutedForeground}
              >
                {d.label.length > 8 ? d.label.slice(0, 8) : d.label}
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    overflow: "hidden",
  },
  titleRow: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  svg: {
    alignSelf: "flex-start",
  },
});
