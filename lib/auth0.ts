import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const auth0 = new Auth0Client({
  enableConnectAccountEndpoint: true,
  authorizationParameters: { scope: 'openid profile email offline_access' },
})

export const googleConnection = process.env.AUTH0_GOOGLE_CONNECTION ?? 'google-oauth2'
export const googleConnectUrl = `/auth/connect?${new URLSearchParams({
  connection: googleConnection,
  returnTo: '/settings',
})}`

export async function getGoogleToken(): Promise<
  { token: string } | { error: string; status: number }
> {
  const session = await auth0.getSession()
  if (!session) return { error: 'Unauthorized', status: 401 }

  try {
    const { token } = await auth0.getAccessTokenForConnection({
      connection: googleConnection,
    })
    return { token }
  } catch {
    return { error: 'Google Calendar not connected', status: 403 }
  }
}
