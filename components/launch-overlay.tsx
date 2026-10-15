import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LAUNCH_BACKGROUND = "/manus-storage/expense-tracker-launch-background_1df854d6.jpg";

export function LaunchOverlay({ onFinished }: { onFinished: () => void }) {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    const timeout = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          setVisible(false);
          onFinished();
        }
      });
    }, 1900);
    return () => clearTimeout(timeout);
  }, [contentY, onFinished, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <ImageBackground source={{ uri: LAUNCH_BACKGROUND }} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.scrim} />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.content, { transform: [{ translateY: contentY }] }]}>
            <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
            <Text style={styles.appName}>Expense Tracker</Text>
            <View style={styles.rule} />
            <Text style={styles.quote}>“Clarity starts with one honest number.”</Text>
            <Text style={styles.kicker}>YOUR MONEY, CLEAR.</Text>
          </Animated.View>
          <Text style={styles.footer}>A calm place to keep your everyday picture in view.</Text>
        </SafeAreaView>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100, backgroundColor: "#14213D" },
  background: { flex: 1 },
  backgroundImage: { resizeMode: "cover" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,33,61,0.72)" },
  safeArea: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between", alignItems: "center" },
  content: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: 50 },
  logo: { width: 92, height: 92, borderRadius: 25, marginBottom: 20 },
  appName: { color: "#FFFFFF", fontSize: 31, fontWeight: "800", letterSpacing: -0.8 },
  rule: { width: 34, height: 3, borderRadius: 2, backgroundColor: "#2FBF9F", marginTop: 23, marginBottom: 20 },
  quote: { color: "#E6F4EF", fontSize: 16, lineHeight: 24, fontWeight: "600", textAlign: "center", maxWidth: 285 },
  kicker: { color: "#9AE7D3", fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 17 },
  footer: { color: "rgba(255,255,255,0.68)", fontSize: 11, textAlign: "center", paddingBottom: 18 },
});
