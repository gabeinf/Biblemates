import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Linking } from 'react-native'
import Paywall from './Paywall'
import type { PlanView } from '../lib/paywall'

const plan = (over: Partial<PlanView> = {}): PlanView => ({
  id: 'a',
  name: 'Yearly',
  price: 'P-YEAR',
  period: 'year',
  perMonth: 'P-MONTH',
  badge: null,
  trial: null,
  ...over,
})
const trial = {
  days: 7,
  billingDate: new Date(2026, 0, 17),
  reminderDate: new Date(2026, 0, 15),
}

async function setup(plans: PlanView[], selectedId = plans[0].id, remind = false) {
  const h = {
    onSelect: jest.fn(),
    onSubscribe: jest.fn(),
    onRestore: jest.fn(),
    onClose: jest.fn(),
  }
  await render(
    <Paywall
      plans={plans}
      selectedId={selectedId}
      remind={remind}
      {...h}
      termsUrl="https://t.example"
      privacyUrl="https://p.example"
    />,
  )
  return { h }
}

function texts(node: unknown): string[] {
  if (typeof node === 'string') return [node]
  if (Array.isArray(node)) return node.flatMap(texts)
  const children = (node as { children?: unknown } | null)?.children
  return children ? texts(children) : []
}

describe('Paywall', () => {
  it('has no price, digit or currency of its own: every figure comes from the plan', async () => {
    await setup([plan({ price: 'P', perMonth: 'M' })])
    expect(texts(screen.toJSON()).join(' ')).not.toMatch(/\d|[$€£]/)
  })

  it('renders store strings and the monthly equivalent, with no timeline or trial copy', async () => {
    await setup([plan()])
    expect(screen.getByText('P-YEAR / year')).toBeTruthy()
    expect(screen.getByText('P-MONTH / month')).toBeTruthy()
    expect(screen.getByText('Covers you and your circle')).toBeTruthy()
    expect(screen.getByText('Continue')).toBeTruthy()
    expect(screen.queryByText('No payment due now')).toBeNull()
    expect(screen.queryByText('Today')).toBeNull()
  })

  it('shows the timeline and "no payment due now" only for a free trial', async () => {
    await setup([plan({ trial })])
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('No payment due now')).toBeTruthy()
    expect(screen.getByText('Start free trial')).toBeTruthy()
  })

  it('writes the trial length and billing date from the plan data', async () => {
    await setup([plan({ trial: { ...trial, days: 14 } })])
    expect(screen.getByText('Your 14-day free trial starts. Nothing is charged.')).toBeTruthy()
    expect(
      screen.getByText(
        new Date(2026, 0, 17).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      ),
    ).toBeTruthy()
  })

  it('shows the reminder step only when a reminder will be scheduled', async () => {
    const reminder = new Date(2026, 0, 15).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    await setup([plan({ trial })])
    expect(screen.queryByText(reminder)).toBeNull()
    await setup([plan({ trial })], 'a', true)
    expect(screen.getByText(reminder)).toBeTruthy()
  })

  it('selects one plan at a time, outlined', async () => {
    const { h } = await setup([plan(), plan({ id: 'b', name: 'Monthly' })], 'b')
    expect(screen.getByRole('radio', { name: /Monthly/ }).props.accessibilityState.selected).toBe(
      true,
    )
    expect(screen.getByRole('radio', { name: /Yearly/ }).props.accessibilityState.selected).toBe(
      false,
    )
    await fireEvent.press(screen.getByRole('radio', { name: /Yearly/ }))
    expect(h.onSelect).toHaveBeenCalledWith('a')
  })

  it('closes from both the back arrow and the close button', async () => {
    const { h } = await setup([plan()])
    await fireEvent.press(screen.getByLabelText('Back'))
    await fireEvent.press(screen.getByLabelText('Close'))
    expect(h.onClose).toHaveBeenCalledTimes(2)
  })

  it('wires subscribe, restore, Terms and Privacy', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never)
    const { h } = await setup([plan()])
    await fireEvent.press(screen.getByText('Continue'))
    await fireEvent.press(screen.getByText('Restore'))
    await fireEvent.press(screen.getByText('Terms'))
    await fireEvent.press(screen.getByText('Privacy'))
    expect(h.onSubscribe).toHaveBeenCalled()
    expect(h.onRestore).toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith('https://t.example')
    expect(open).toHaveBeenCalledWith('https://p.example')
  })
})
