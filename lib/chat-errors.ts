import { APICallError } from 'ai'

export const CHAT_CAPACITY_REACHED = 'chat_capacity_reached'
export const CHAT_CAPACITY_PAUSE_MS = 5 * 60 * 1000

export function getChatCapacityPauseDeadline(value: string | null, now = Date.now()): number {
  const deadline = Number(value)
  return Number.isSafeInteger(deadline) && deadline > now && deadline - now <= CHAT_CAPACITY_PAUSE_MS
    ? deadline
    : 0
}

export function getChatStreamError(error: unknown): string {
  if (error instanceof Error && 'statusCode' in error && error.statusCode === 402) {
    const underlying = APICallError.isInstance(error) ? error : error.cause
    if (APICallError.isInstance(underlying)) {
      const data = underlying.data as { error?: { type?: unknown } } | undefined
      if (data?.error?.type === 'quota_for_entity_exceeded') return CHAT_CAPACITY_REACHED
    }
  }

  return 'An error occurred.'
}
