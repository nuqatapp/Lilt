import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Habit } from "@/context/HabitsContext";
import { useColors } from "@/hooks/useColors";

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  streak: number;
  onToggle: () => void;
  onLongPress?: () => void;
}

export function HabitCard({
  habit,
  completed,
  streak,
  onToggle,
  onLongPress,
}: HabitCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(completed ? 1 : 0);

  React.useEffect(() => {
    checkScale.value = withSpring(completed ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [completed]);

  const handleToggle = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 8 }, () => {
      scale.value = withSpring(1, { damping: 8 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }, [onToggle]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: withTiming(completed ? 1 : 0, { duration: 150 }),
  }));

  return (
    <Animated.View style={[cardStyle, styles.wrapper]}>
      <Pressable
        onPress={handleToggle}
        onLongPress={onLongPress}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: completed ? habit.color : colors.border,
            borderWidth: completed ? 1.5 : 1,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: habit.color + "20" }]}>
          <Feather name={habit.icon as any} size={20} color={habit.color} />
        </View>
        <View style={styles.content}>
          <Text
            style={[
              styles.name,
              {
                color: completed ? colors.mutedForeground : colors.foreground,
                textDecorationLine: completed ? "line-through" : "none",
              },
            ]}
          >
            {habit.name}
          </Text>
          {streak > 0 && (
            <View style={styles.streakRow}>
              <Feather name="zap" size={12} color={colors.warning} />
              <Text style={[styles.streak, { color: colors.mutedForeground }]}>
                {streak} day{streak !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.check,
            {
              backgroundColor: completed ? habit.color : "transparent",
              borderColor: completed ? habit.color : colors.border,
            },
          ]}
        >
          <Animated.View style={checkStyle}>
            <Feather name="check" size={14} color="#fff" />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streak: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
