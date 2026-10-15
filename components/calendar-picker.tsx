import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getMonthKey, getMonthLabel, shiftMonth } from "@/lib/expense-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

function monthDays(monthKey: string): (number | null)[] {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
}

export function CalendarPicker({ value, visible, onChange, onClose }: { value: string; visible: boolean; onChange: (date: string) => void; onClose: () => void }) {
  const [monthKey, setMonthKey] = useState(value.slice(0, 7));
  const days = useMemo(() => monthDays(monthKey), [monthKey]);
  if (!visible) return null;
  const [year, month] = monthKey.split("-").map(Number);
  return <View style={styles.card}>
    <View style={styles.header}><Pressable accessibilityLabel="Previous calendar month" onPress={() => setMonthKey(shiftMonth(monthKey, -1))} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}><IconSymbol name="chevron.left" size={17} color="#667085" /></Pressable><View style={styles.headerCopy}><Text style={styles.monthLabel}>{getMonthLabel(monthKey)}</Text><Text style={styles.helper}>Choose a start date</Text></View><Pressable accessibilityLabel="Next calendar month" onPress={() => setMonthKey(shiftMonth(monthKey, 1))} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}><IconSymbol name="chevron.right" size={17} color="#667085" /></Pressable></View>
    <View style={styles.weekRow}>{["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
    <View style={styles.grid}>{days.map((day, index) => {
      if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
      const date = `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
      const selected = date === value;
      return <Pressable key={date} onPress={() => { onChange(date); onClose(); }} style={({ pressed }) => [styles.dayCell, selected && styles.selectedDay, pressed && styles.pressed]}><Text style={[styles.dayText, selected && styles.selectedDayText]}>{day}</Text></Pressable>;
    })}</View>
    <Pressable onPress={onClose} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}><Text style={styles.doneText}>Done</Text></Pressable>
  </View>;
}

export function defaultCalendarMonth(value: string): string {
  return getMonthKey(new Date(`${value}T12:00:00`));
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#F7FAF9", borderRadius: 15, borderWidth: 1, borderColor: "#D9F1E9", padding: 12, marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerCopy: { alignItems: "center" },
  monthLabel: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  helper: { color: "#98A2B3", fontSize: 9, marginTop: 2 },
  navButton: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  weekRow: { flexDirection: "row", marginTop: 12, marginBottom: 5 },
  weekDay: { width: "14.285%", textAlign: "center", color: "#98A2B3", fontSize: 9, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.285%", height: 31, alignItems: "center", justifyContent: "center", borderRadius: 9, marginVertical: 1 },
  dayText: { color: "#667085", fontSize: 11, fontWeight: "700" },
  selectedDay: { backgroundColor: "#2FBF9F" },
  selectedDayText: { color: "#FFFFFF" },
  doneButton: { alignSelf: "center", paddingHorizontal: 15, height: 28, borderRadius: 9, backgroundColor: "#E5F6F1", alignItems: "center", justifyContent: "center", marginTop: 8 },
  doneText: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.7 },
});
