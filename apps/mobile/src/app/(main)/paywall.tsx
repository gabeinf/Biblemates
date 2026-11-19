import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import Paywall from '../../components/Paywall'
import { usePaywallOffer } from '../../hooks/use-paywall'
import { canRemind, scheduleTrialReminder } from '../../lib/trial-reminder'
import { planViews } from '../../lib/paywall'
import { privacyUrl, purchase, restore, termsUrl } from '../../lib/purchases'

/** Shown once after the first completed reading. Closing it never locks anything. */
export default function PaywallScreen() {
  const router = useRouter()
  const offer = usePaywallOffer()
  const [selected, setSelected] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remind, setRemind] = useState(false)
  useEffect(() => {
    canRemind().then(setRemind)
  }, [])

  const privacy = privacyUrl()
  const pkgs = offer.data?.packages ?? []
  // Nothing to sell (no key, no offering): leave quietly instead of showing an empty sheet.
  const empty = !pkgs.length || !privacy
  useEffect(() => {
    if (empty && !offer.isPending) router.back()
  }, [empty, offer.isPending, router])
  if (empty) return null

  const run = async (task: () => Promise<boolean>, none?: string) => {
    setBusy(true)
    setError(null)
    try {
      if (await task()) router.back()
      else if (none) setError(none)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const plans = planViews(pkgs, new Date(), offer.data?.introEligible ?? [])
  const chosen = pkgs.find((p) => p.identifier === (selected ?? plans[0].id)) ?? pkgs[0]
  const reminderDate = remind
    ? plans.find((p) => p.id === chosen.identifier)?.trial?.reminderDate
    : null
  const subscribe = async () => {
    const done = await purchase(chosen)
    // The timeline only promises a reminder when we can deliver it.
    if (done && reminderDate) await scheduleTrialReminder(reminderDate)
    return done
  }
  return (
    <Paywall
      plans={plans}
      selectedId={chosen.identifier}
      onSelect={setSelected}
      onSubscribe={() => run(subscribe)}
      onRestore={() => run(restore, 'No earlier purchase was found.')}
      onClose={() => router.back()}
      remind={remind}
      busy={busy}
      error={error}
      termsUrl={termsUrl()}
      privacyUrl={privacy!}
    />
  )
}
