import { Slot } from "expo-router";

export default function RootLayout() {
  // Render child routes immediately so root-level redirects can run safely.
  return <Slot />;
}
