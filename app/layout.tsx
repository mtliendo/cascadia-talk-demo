import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import { auth0 } from '@/lib/auth0'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['SOFT', 'opsz'],
})

export const metadata: Metadata = {
  title: 'FlightMind — AI Flight Assistant',
  description: 'Book flights with an AI assistant that knows when to ask for your permission.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth0.getSession().catch(() => null)

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-grain">
        <Auth0Provider user={session?.user}>{children}</Auth0Provider>
      </body>
    </html>
  )
}
