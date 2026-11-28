import { useState } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import { AppText, PastureView } from '../../../components/ui'
import { useCircle, useMembers, useMyCircle } from '../../../hooks/queries'
import { space, useTheme } from '../../../theme'

export default function Pasture() {
  const theme = useTheme()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const myCircle = useMyCircle()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([myCircle.refetch(), members.refetch()])
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <ScrollView
      testID="pasture-scroll"
      style={{ backgroundColor: theme.bg }}
      contentContainerStyle={{ gap: space.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PastureView lambCount={members.data?.length ?? 0} />
      <AppText variant="title" style={{ paddingHorizontal: space.lg }}>
        {circle.name}
      </AppText>
    </ScrollView>
  )
}
