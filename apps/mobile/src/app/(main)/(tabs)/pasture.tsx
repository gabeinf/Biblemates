import { View } from 'react-native'
import { EmptyState } from '../../../components/ui'
import { useTheme } from '../../../theme'

// Placeholder so the tab shell runs; the real screen replaces it.
export default function Pasture() {
  const theme = useTheme()
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.bg }}>
      <EmptyState headline="Your pasture is coming" body="Check back soon." />
    </View>
  )
}
