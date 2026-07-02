'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isToolOrDynamicToolUIPart, type UIMessage } from 'ai'
import { useRef, useEffect, useState } from 'react'
import { Streamdown } from 'streamdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
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
  initiatePayment: 'Requesting payment approval',
  checkSeatUpgrade: 'Checking seat upgrade',
  initiateSeatsUpgradeCIBA: 'Initiating Guardian push',
}

const CHAT_STORAGE_KEY = 'flightmind-chat-history'

function loadStoredMessages(): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function ChatInterface({ userInitials }: { userInitials: string }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  // Load history from localStorage after mount, not as initial state — the
  // server always renders an empty chat, so hydrating with stored messages
  // directly would create a server/client markup mismatch.
  useEffect(() => {
    const stored = loadStoredMessages()
    if (stored.length > 0) {
      setMessages(stored)
      setShowSuggestions(false)
    }
    setIsHydrated(true)
  }, [setMessages])

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // localStorage unavailable (e.g. private browsing quota) — chat still works, just won't persist
    }
  }, [messages, isHydrated])

  function clearChat() {
    setMessages([])
    setShowSuggestions(true)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHAT_STORAGE_KEY)
    }
  }

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const suggestions = [
    'Find me a flight from San Francisco to Chicago today',
    "What's the cheapest flight available?",
    'Book the Alaska Airlines flight for me',
  ]

  async function handleSend(text: string) {
    if (!text.trim() || isLoading) return
    setInput('')
    setShowSuggestions(false)
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
        {messages.length === 0 && showSuggestions && (
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
                  className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-colors text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageRow key={message.id} message={message} userInitials={userInitials} />
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
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Something went wrong. Please try again.
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
            placeholder="Ask me to find or book a flight…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed max-h-32 overflow-y-auto"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
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
}: {
  message: UIMessage
  userInitials: string
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
          <MessagePart key={i} part={part} isUser={isUser} />
        ))}
      </div>
    </div>
  )
}

function MessagePart({
  part,
  isUser,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  part: any
  isUser: boolean
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

    return (
      <div className="flex items-center gap-2 text-xs bg-background/80 border border-border/60 rounded-xl px-3 py-2 text-muted-foreground">
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 shrink-0" />
        )}
        <span>{label}</span>
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
