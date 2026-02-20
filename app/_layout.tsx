import { Slot } from "expo-router";

export default function RootLayout() {
  // Render child routes and groups (including the (tabs) group) normally.
  return <Slot />;
}
