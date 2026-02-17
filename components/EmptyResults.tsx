1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

interface EmptyResultsProps {
  message?: string;
}

export default function EmptyResults({ message }: EmptyResultsProps) {
  return (
    <View style={styles.container}>
      <Feather name="search" size={48} color={colors.mediumGray} />
      <Text style={styles.title}>No Results Found</Text>
      <Text style={styles.message}>
        {message || "Try searching for legal information using specific terms like 'Alabama emergency custody' or 'Texas child support calculation'."}
      </Text>
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
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: "center",
    lineHeight: 24,
  },
});// TODO: Implement this file
