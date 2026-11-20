import { Redirect } from 'expo-router'

/** Any URL no route matches (e.g. a stale `/onboarding/<x>`) goes home instead of a dead end. */
export default function NotFound() {
  return <Redirect href="/" />
}
