import { Redirect } from "expo-router";

export default function SearchRoute() {
  // /search is a legacy route; send users to the app root.
  return <Redirect href="/" />;
}
