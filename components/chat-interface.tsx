'use client'

import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import {
  DefaultChatTransport,
  isToolOrDynamicToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from 'ai'
import { useRef, useEffect, useState, useSyncExternalStore } from 'react'
import { Streamdown } from 'streamdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { hasPendingApproval } from '@/lib/chat-approvals'
import { CHAT_CAPACITY_REACHED } from '@/lib/chat-errors'
import {
  ArrowUp,
  Bot,
  Loader2,
  Plane,
  AlertCircle,
  Trash2,
} from 'lucide-react'

const TOOL_LABELS: Record<string, string> = {
  searchFlights: 'Searching flights',
  getSeats: 'Loading seat map',
  bookFlight: 'Holding flight',
  checkGoogleCalendar: 'Checking calendar access',
  addToCalendar: 'Adding to calendar',
  findPromoCode: 'Hunting for promo codes',
  initiatePayment: 'Simulated Stripe Link payment',
  checkSeatUpgrade: 'Checking seat upgrade',
  initiateSeatsUpgradeCIBA: 'Simulated CIBA/Guardian upgrade',
}

type RespondToApproval = (response: { id: string; approved: boolean }) => void

function loadStoredMessages(storageKey: string): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

type ChatProps = { userInitials: string; storageKey: string }

const subscribeToHydration = () => () => {}

export function ChatInterface(props: ChatProps) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  return hydrated ? <Chat key={props.storageKey} {...props} /> : null
}

function Chat({ userInitials, storageKey }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [initialMessages] = useState(() => loadStoredMessages(storageKey))

  const { messages, sendMessage, status, error, setMessages, addToolApprovalResponse } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {
      // Chat still works when session storage is unavailable.
    }
  }, [messages, storageKey])

  function clearChat() {
    setMessages([])
    if (typeof window !== 'undefined') {
      try { window.sessionStorage.removeItem(storageKey) } catch {}
    }
  }

  const isLoading = status === 'streaming' || status === 'submitted'
  const approvalPending = hasPendingApproval(messages.at(-1))
  const capacityReached = error?.message === CHAT_CAPACITY_REACHED
  const canSend = !isLoading && !approvalPending && !capacityReached

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, error])

  const suggestions = [
    'Find me a flight from San Francisco to Chicago today',
    "What's the cheapest flight available?",
    'Book the Alaska Airlines flight for me',
  ]

  async function handleSend(text: string) {
    if (!text.trim() || !canSend) return
    setInput('')
    await sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {messages.length > 0 && (
        <div className="flex justify-end px-4 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear chat
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8 animate-in fade-in duration-500">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Plane className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-medium text-lg text-foreground mb-1">
                Ready to book your flight
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Tell me where you want to go and I&apos;ll handle the rest — pausing for your
                approval at every step that matters.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={!canSend}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-colors text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageRow
            key={message.id}
            message={message}
            userInitials={userInitials}
            respondToApproval={index === messages.length - 1 && !isLoading && !capacityReached ? addToolApprovalResponse : undefined}
          />
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-muted/60 border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {capacityReached ? (
              <div className="space-y-1">
                <p>Live chat has reached this demo&apos;s monthly usage limit. Come back later, or explore how the demo works.</p>
                <Link className="underline" href="/#patterns">See the four approval steps</Link>
              </div>
            ) : 'Something went wrong. Please try again.'}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/60 p-4">
        <div className="relative flex items-end gap-2 bg-muted/40 border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={capacityReached ? 'Live chat is paused' : approvalPending ? 'Approve or decline to continue…' : 'Ask me to find or book a flight…'}
            disabled={approvalPending || capacityReached}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed max-h-32 overflow-y-auto"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => handleSend(input)}
            disabled={!canSend || !input.trim()}
            className="shrink-0 h-7 w-7 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          This agent may pause to ask for your approval at key steps.
        </p>
      </div>
    </div>
  )
}

function MessageRow({
  message,
  userInitials,
  respondToApproval,
}: {
  message: UIMessage
  userInitials: string
  respondToApproval?: RespondToApproval
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {isUser ? (
        <Avatar className="w-7 h-7 shrink-0 mt-0.5">
          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] space-y-2',
          isUser && 'items-end flex flex-col'
        )}
      >
        {message.parts.map((part, i) => (
          <MessagePart key={i} part={part} isUser={isUser} respondToApproval={respondToApproval} />
        ))}
      </div>
    </div>
  )
}

function MessagePart({
  part,
  isUser,
  respondToApproval,
}: {
  part: UIMessage['parts'][number]
  isUser: boolean
  respondToApproval?: RespondToApproval
}) {
  if (part.type === 'text') {
    if (isUser) {
      return (
        <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground">
          {part.text}
        </div>
      )
    }

    return (
      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed bg-muted/60 border border-border/60 text-foreground">
        <Streamdown className="text-sm">{part.text}</Streamdown>
      </div>
    )
  }

  if (isToolOrDynamicToolUIPart(part)) {
    const toolName =
      part.type === 'dynamic-tool'
        ? (part as { toolName: string }).toolName
        : part.type.replace('tool-', '')
    const state = part.state
    const label = TOOL_LABELS[toolName] ?? toolName
    const isPending = state === 'input-streaming' || state === 'input-available'

    if (toolName === 'checkGoogleCalendar' && state === 'output-available' &&
        (part.output as { connected?: boolean } | undefined)?.connected === false) {
      return (
        <a className="text-sm text-primary underline" href="/settings" target="_blank" rel="noopener noreferrer">
          Connect Google Calendar (opens a new tab)
        </a>
      )
    }

    if (state === 'approval-requested') {
      const input = part.input as { title?: string; flightId?: string; upgradeSeat?: string }
      const description = input.title ?? input.flightId ?? input.upgradeSeat
      return (
        <div className="space-y-2 rounded-xl border border-border bg-background p-3 text-sm">
          <p className="font-medium">{label}</p>
          {description && <p className="text-muted-foreground">{description}</p>}
          {respondToApproval ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respondToApproval({ id: part.approval.id, approved: true })}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => respondToApproval({ id: part.approval.id, approved: false })}>
                Decline
              </Button>
            </div>
          ) : <p className="text-muted-foreground">Awaiting approval</p>}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-xs bg-background/80 border border-border/60 rounded-xl px-3 py-2 text-muted-foreground">
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 shrink-0" />
        )}
        <span>{label}{state === 'output-denied' ? ' — declined' : ''}</span>
        {isPending && (
          <Badge variant="secondary" className="ml-auto text-xs py-0 h-4">
            running
          </Badge>
        )}
      </div>
    )
  }

  return null
}
