import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  appendInboundMessage,
  createOutboundMessage,
  initialCommunicationThreads,
  markThreadRead,
  updateMessageStatus,
  type CommunicationThread,
  type SmsMessage,
} from './communicationDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'

const STORAGE_KEY = 'zaberman-communications:v1'
const mockReplies = [
  'Thank you, I received the update.',
  'Sounds good. Please message me when you arrive.',
  'The entrance is open. I will meet the team outside.',
]

interface CommunicationContextValue {
  threads: CommunicationThread[]
  unreadTotal: number
  getThread: (orderNumber: string) => CommunicationThread | undefined
  sendMessage: (orderNumber: string, body: string) => void
  retryMessage: (orderNumber: string, messageId: string) => void
  markRead: (orderNumber: string) => void
  receiveMockReply: (orderNumber: string) => void
}

const CommunicationContext = createContext<CommunicationContextValue | null>(null)

function readThreads() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as CommunicationThread[] : structuredClone(initialCommunicationThreads)
  } catch {
    return structuredClone(initialCommunicationThreads)
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function CommunicationProvider({ children }: { children: ReactNode }) {
  const { network, smsOutcome } = usePrototypeScenario()
  const [threads, setThreads] = useState<CommunicationThread[]>(readThreads)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads))
  }, [threads])

  useEffect(() => {
    if (network === 'offline') return
    setThreads((current) => current.map((thread) => ({
      ...thread,
      messages: thread.messages.map((message) => message.status === 'queued' ? { ...message, status: 'sending' } : message),
    })))
  }, [network])

  useEffect(() => {
    if (network === 'offline' || !threads.some((thread) => thread.messages.some((message) => message.status === 'sending'))) return
    const timer = window.setTimeout(() => {
      setThreads((current) => current.map((thread) => ({
        ...thread,
        messages: thread.messages.map((message) => message.status === 'sending'
          ? { ...message, status: smsOutcome === 'success' ? 'sent' : 'failed' }
          : message),
      })))
    }, 500)
    return () => window.clearTimeout(timer)
  }, [network, smsOutcome, threads])

  const updateThread = useCallback((orderNumber: string, update: (thread: CommunicationThread) => CommunicationThread) => {
    setThreads((current) => current.map((thread) => thread.orderNumber === orderNumber ? update(thread) : thread))
  }, [])

  const sendMessage = useCallback((orderNumber: string, body: string) => {
    updateThread(orderNumber, (thread) => createOutboundMessage(
      thread,
      body,
      network === 'offline',
      makeId(`outbound-${orderNumber}`),
      new Date().toISOString(),
    ))
  }, [network, updateThread])

  const retryMessage = useCallback((orderNumber: string, messageId: string) => {
    updateThread(orderNumber, (thread) => updateMessageStatus(thread, messageId, network === 'offline' ? 'queued' : 'sending'))
  }, [network, updateThread])

  const markRead = useCallback((orderNumber: string) => {
    updateThread(orderNumber, markThreadRead)
  }, [updateThread])

  const receiveMockReply = useCallback((orderNumber: string) => {
    updateThread(orderNumber, (thread) => {
      const inboundCount = thread.messages.filter((message) => message.direction === 'inbound').length
      const message: SmsMessage = {
        id: makeId(`inbound-${orderNumber}`),
        direction: 'inbound',
        body: mockReplies[inboundCount % mockReplies.length],
        createdAt: new Date().toISOString(),
        status: 'received',
      }
      return appendInboundMessage(thread, message)
    })
  }, [updateThread])

  const value = useMemo<CommunicationContextValue>(() => ({
    threads,
    unreadTotal: threads.reduce((total, thread) => total + thread.unreadCount, 0),
    getThread: (orderNumber) => threads.find((thread) => thread.orderNumber === orderNumber),
    sendMessage,
    retryMessage,
    markRead,
    receiveMockReply,
  }), [markRead, receiveMockReply, retryMessage, sendMessage, threads])

  return <CommunicationContext.Provider value={value}>{children}</CommunicationContext.Provider>
}

export function useCommunications() {
  const value = useContext(CommunicationContext)
  if (!value) throw new Error('useCommunications must be used inside CommunicationProvider')
  return value
}
