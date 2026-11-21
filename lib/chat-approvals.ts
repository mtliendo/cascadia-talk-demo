import { isToolOrDynamicToolUIPart, type UIMessage } from 'ai'

export function hasPendingApproval(message: UIMessage | undefined): boolean {
  return message?.role === 'assistant' && message.parts.some(
    part => isToolOrDynamicToolUIPart(part) && part.state === 'approval-requested',
  )
}
