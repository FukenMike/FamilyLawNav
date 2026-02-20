import { Redirect } from "expo-router";

export default function Index() {
  // Default to the tab-group Search screen so the tab bar is the app shell.
  return <Redirect href="/search" />;
}
