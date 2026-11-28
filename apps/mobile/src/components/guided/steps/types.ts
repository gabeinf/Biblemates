import type { CircleMember, CircleStudy, StudyDay } from '../../../types/db'

/** What every guided step receives. A step calls `onReady(true)` when the user may Continue. */
export type StepProps = {
  day: StudyDay
  circleStudy: CircleStudy
  members: CircleMember[]
  onReady: (ready: boolean) => void
}
