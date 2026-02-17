import React from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { colors } from "@/constants/colors";

export default function LoadingResults() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Searching legal resources...</Text>
      <Text style={styles.subtext}>This may take a moment as we analyze and summarize the results.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: "center",
  },
});
// TODO(PHASE-?): Implement this module fully
