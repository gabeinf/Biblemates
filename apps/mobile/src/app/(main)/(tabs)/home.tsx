import { Redirect } from 'expo-router'

/** Old URL for the Today tab (deep links, pushes, cached routes). */
export default function Home() {
  return <Redirect href="/today" />
}
