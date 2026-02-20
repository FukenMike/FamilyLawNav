import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#1976d2" }}>
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="navigator"
        options={{
          title: "Navigator",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
