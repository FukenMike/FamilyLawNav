import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mediumGray,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Legal Search",
          tabBarLabel: "Search",
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved Results",
          tabBarLabel: "Saved",
          tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarLabel: "About",
          tabBarIcon: ({ color }) => <Feather name="info" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
// TODO(PHASE-?): Implement this module fully
