import { Redirect } from "expo-router";

export default function Index() {
  // Use a declarative redirect so navigation occurs only after layouts mount.
  return <Redirect href="/navigator" />;
}
