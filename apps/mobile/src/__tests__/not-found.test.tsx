import { describe, expect, it, jest } from '@jest/globals'
import { render } from '@testing-library/react-native'
import NotFound from '../app/+not-found'

jest.mock('expo-router', () => {
  const { Text } = require('react-native')
  return { Redirect: ({ href }: { href: string }) => <Text>redirect:{href}</Text> }
})

describe('+not-found', () => {
  it('redirects an unknown URL such as /onboarding/zzz to the root', async () => {
    const { getByText } = await render(<NotFound />)
    expect(getByText('redirect:/')).toBeTruthy()
  })
})
