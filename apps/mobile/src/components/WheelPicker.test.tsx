import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { WheelPicker } from './WheelPicker'
import { daysSuffix } from '../lib/wheel'

const VALUES = [1, 2, 3, 4, 5, 6, 7]

async function setup(value = 3) {
  const onChange = jest.fn<(n: number) => void>()
  await render(
    <WheelPicker values={VALUES} value={value} onChange={onChange} suffix={daysSuffix} label="Days per week" />,
  )
  return { onChange, picker: screen.getByLabelText('Days per week') }
}

const adjust = async (el: ReturnType<typeof screen.getByLabelText>, actionName: string) =>
  await fireEvent(el, 'accessibilityAction', { nativeEvent: { actionName } })

describe('WheelPicker', () => {
  it('is an adjustable control announcing the value with its suffix', async () => {
    const { picker } = await setup()
    expect(picker.props.accessibilityRole).toBe('adjustable')
    expect(picker.props.accessibilityValue).toMatchObject({ min: 1, max: 7, now: 3, text: '3 days' })
  })

  it('steps with screen-reader increment and decrement, even twice in a row', async () => {
    const { picker, onChange } = await setup()
    await adjust(picker, 'increment')
    await adjust(picker, 'increment')
    expect(onChange).toHaveBeenLastCalledWith(5)
    await adjust(picker, 'decrement')
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it('stops at the ends', async () => {
    const { picker, onChange } = await setup(1)
    await adjust(picker, 'decrement')
    expect(onChange).not.toHaveBeenCalled()
    expect(picker.props.accessibilityValue).toMatchObject({ now: 1, text: '1 day' })
  })
})
