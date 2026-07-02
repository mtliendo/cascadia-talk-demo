import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth0, getGoogleToken } from '@/lib/auth0'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Bot,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Key,
  LogOut,
  Mail,
  Shield,
  User,
  XCircle,
} from 'lucide-react'

export default async function SettingsPage() {
  const session = await auth0.getSession()

  if (!session) {
    redirect('/auth/login?returnTo=/settings')
  }

  const { user } = session

  const googleResult = await getGoogleToken()
  const googleConnected = 'token' in googleResult

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-sm">FlightMind</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground">Settings</span>
          </div>
          <Link href="/auth/logout">
            <Button variant="ghost" size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Sign out</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-medium text-foreground mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and connected services.
          </p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your Auth0 account information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user.picture ?? undefined} alt={user.name ?? 'User'} />
                <AvatarFallback className="text-base bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-semibold">{user.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Shield className="w-3 h-3" />
                  {user.sub}
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auth0 Session</p>
                <p className="text-xs text-muted-foreground">
                  Authenticated via Auth0 Universal Login.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5 text-emerald-600 bg-emerald-400/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar Connection */}
        <Card
          className={
            googleConnected
              ? 'border-emerald-400/30 bg-emerald-400/5'
              : 'border-amber-400/30 bg-amber-400/5'
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="w-4 h-4 text-primary" />
              Google Calendar
              {googleConnected ? (
                <Badge
                  variant="outline"
                  className="ml-auto text-emerald-600 border-emerald-400/40 bg-emerald-400/5 gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="ml-auto text-amber-600 border-amber-400/40 bg-amber-400/5 gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Not connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {googleConnected
                ? 'Your Google Calendar is linked via Auth0 Token Vault. Your credentials are encrypted and managed securely — this app never stores your Google tokens directly.'
                : 'Connect your Google account to let the AI assistant add flights to your calendar. Auth0 Token Vault will securely store your tokens, encrypted and auto-refreshed.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`rounded-lg border p-4 ${
                googleConnected
                  ? 'border-emerald-400/20 bg-emerald-400/5'
                  : 'border-amber-400/20 bg-amber-400/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {googleConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {googleConnected ? 'Token Vault Active' : 'Secured by Auth0 Token Vault'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {googleConnected
                      ? 'Auth0 Token Vault is securely managing your Google OAuth tokens. Access tokens are automatically refreshed — you never need to re-authorize.'
                      : 'When you connect, Auth0 Token Vault will encrypt and store your Google refresh token. This app never has direct access to your credentials.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/auth/connect?connection=google-oauth2&returnTo=/settings"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {googleConnected ? 'Reconnect Google' : 'Connect Google Calendar'}
              </a>

              {googleConnected && (
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full sm:w-auto gap-2">
                    <Calendar className="w-4 h-4" />
                    Back to assistant
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Token Vault explainer */}
        <Card className="bg-muted/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              How Auth0 Token Vault Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {[
              {
                n: '1',
                text: (
                  <>
                    You click <strong className="text-foreground">Connect Google Calendar</strong>{' '}
                    and Auth0 redirects you to Google&apos;s OAuth consent screen.
                  </>
                ),
              },
              {
                n: '2',
                text: (
                  <>
                    After you grant access, Auth0 intercepts the Google refresh token and stores it
                    encrypted in <strong className="text-foreground">Token Vault</strong> — it never
                    reaches this app.
                  </>
                ),
              },
              {
                n: '3',
                text: (
                  <>
                    When the assistant needs calendar access, it requests a fresh Google access token
                    from Token Vault — scoped, short-lived, and secure.
                  </>
                ),
              },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-3">
                <span className="font-mono text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                  {n}
                </span>
                <p>{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
