import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Search" }} />
      <Tabs.Screen name="navigator" options={{ title: "Navigator" }} />
    </Tabs>
  );
}
