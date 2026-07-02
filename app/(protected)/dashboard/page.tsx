import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth0 } from '@/lib/auth0'
import { ChatInterface } from '@/components/chat-interface'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Bot, LogOut, Settings } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/auth/login?returnTo=/dashboard')
  }

  const { user } = session
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="relative flex flex-col h-screen bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid" />
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-sm">FlightMind</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.picture ?? undefined} alt={user.name ?? 'User'} />
              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.name ?? user.email}
            </span>
            <Link href="/auth/logout">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat fills remaining height */}
      <div className="flex-1 overflow-hidden max-w-4xl w-full mx-auto">
        <ChatInterface userInitials={userInitials} />
      </div>
    </div>
  )
}
