import { Redirect } from 'expo-router';

// Neutralize duplicate root-level route — canonical Search lives at app/(tabs)/search.tsx
export default function LegacySearchRedirect() {
  return <Redirect href="/search" />;
}
