import { useEffect } from 'react'
import { GuidedShell } from '../../components/guided/GuidedShell'
import { ErrorState, Loading } from '../../components/ui'
import { useCircle, useCircleStudy, useMembers } from '../../hooks/queries'
import { setTabBarHidden } from '../../lib/tab-bar'
import { currentDay } from '../../lib/study-day'

/** The guided Today session. Full-screen: the tab bar is tucked away while it's open. */
export default function Guided() {
  const circle = useCircle()
  const cs = useCircleStudy(circle.id)
  const members = useMembers(circle.id)

  useEffect(() => {
    setTabBarHidden(true)
    return () => setTabBarHidden(false)
  }, [])

  if (cs.isPending || members.isPending) return <Loading />
  const day = cs.data ? currentDay(cs.data) : undefined
  if (!cs.data || !day) return <ErrorState message="No study today." onRetry={() => cs.refetch()} />
  return <GuidedShell day={day} circleStudy={cs.data} members={members.data ?? []} />
}
