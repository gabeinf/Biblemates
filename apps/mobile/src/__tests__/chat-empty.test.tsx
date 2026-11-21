// Empty-state tests for Chat and Chat history. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Chat from '../app/(main)/chat'
import ChatHistory from '../app/(main)/chat-history'

let mockParams: { id?: string } = {}
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), setParams: jest.fn(), dismissTo: jest.fn() }),
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}))
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: jest.fn() }) }))
jest.mock('../services/chat', () => ({ sendAsk: jest.fn() }))

const mockQuery = <T,>(data: T) => ({ data, isPending: false, isError: false, refetch: jest.fn() })
let mockConversations: unknown[] = []
jest.mock('../hooks/queries', () => ({
  qk: { conversations: ['c'], messages: (id: string) => ['m', id] },
  useConversationMessages: () => ({ data: [{ id: 'm1', role: 'user', content: 'Hello', citations: [], crisis: false }], isPending: false }),
  useConversations: () => mockQuery(mockConversations),
  useDeleteConversation: () => ({ mutate: jest.fn() }),
}))

describe('Chat empty state', () => {
  beforeEach(() => {
    mockParams = {}
  })

  it('shows one lamb above the welcome, and it follows the keyboard animation', async () => {
    await render(<Chat />)
    expect(screen.getAllByLabelText('A lamb')).toHaveLength(1)
    expect(screen.getByText('How are you feeling?')).toBeTruthy()
    expect(useReanimatedKeyboardAnimation).toHaveBeenCalled()
  })

  it('has no lamb once a conversation is open', async () => {
    mockParams = { id: 'conv1' }
    await render(<Chat />)
    expect(screen.getByText('Hello')).toBeTruthy()
    expect(screen.queryByLabelText('A lamb')).toBeNull()
  })
})

describe('Chat history empty state', () => {
  it('shows one lamb when there are no chats', async () => {
    mockConversations = []
    await render(<ChatHistory />)
    expect(screen.getAllByLabelText('A lamb')).toHaveLength(1)
    expect(screen.getByText('No chats yet')).toBeTruthy()
  })

  it('has no lamb when chats exist', async () => {
    mockConversations = [{ id: 'c1', title: 'Peace', mood: null, updated_at: new Date().toISOString() }]
    await render(<ChatHistory />)
    expect(screen.getByText('Peace')).toBeTruthy()
    expect(screen.queryByLabelText('A lamb')).toBeNull()
  })
})
