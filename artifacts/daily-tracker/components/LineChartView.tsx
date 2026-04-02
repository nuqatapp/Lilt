import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface DataSeries {
  label: string;
  color: string;
  data: number[];
}

interface LineChartViewProps {
  series: DataSeries[];
  xLabels: string[];
  height?: number;
  title?: string;
}

export function LineChartView({ series, xLabels, height = 150, title }: LineChartViewProps) {
  const colors = useColors();
  const svgW = 320;
  const svgH = height;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 26;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const n = xLabels.length;

  const allVals = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allVals, 1);

  const xPos = (i: number) => padL + (i / (n - 1 || 1)) * plotW;
  const yPos = (v: number) => padT + plotH - (v / maxVal) * plotH;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {title && (
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      )}
      <View style={styles.legendRow}>
        {series.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {series.map((s) => {
          const pts = s.data.map((v, i) => `${xPos(i)},${yPos(v)}`);
          const d = pts.length > 1 ? `M ${pts.join(" L ")}` : "";
          return (
            <React.Fragment key={s.label}>
              {d ? (
                <Path
                  d={d}
                  stroke={s.color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {s.data.map((v, i) => (
                <Circle key={i} cx={xPos(i)} cy={yPos(v)} r={4} fill={s.color} />
              ))}
            </React.Fragment>
          );
        })}
        {xLabels.map((lbl, i) => (
          <SvgText
            key={lbl}
            x={xPos(i)}
            y={svgH - 6}
            textAnchor="middle"
            fontSize="11"
            fill={colors.mutedForeground}
          >
            {lbl}
          </SvgText>
        ))}
      </Svg>
      <Text style={[styles.xAxisLabel, { color: colors.mutedForeground }]}>This week</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  xAxisLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
});
