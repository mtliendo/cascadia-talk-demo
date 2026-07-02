import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const auth0 = new Auth0Client({
  enableConnectAccountEndpoint: true,
})

export async function getGoogleToken(): Promise<
  { token: string } | { error: string; status: number }
> {
  const session = await auth0.getSession()
  if (!session) return { error: 'Unauthorized', status: 401 }

  try {
    const { token } = await auth0.getAccessTokenForConnection({
      connection: 'google-oauth2',
    })
    return { token }
  } catch {
    return { error: 'Google Calendar not connected', status: 403 }
  }
}
